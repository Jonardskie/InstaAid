"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Home, Phone, AlertTriangle, User, Settings } from "lucide-react";
import Link from "next/link";
import { db } from "../../lib/firebase";
import { ref, onValue, set } from "firebase/database";

/* Leaflet / React-Leaflet */
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

/* Fix for default icon URLs (use CDN links for stability) */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

/* Small helper component: recenter the map when coords update */
function RecenterAutomatically({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("home");
  const [status, setStatus] = useState("Loading...");
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 });
  const [battery, setBattery] = useState("Unknown");
  const [lastSeen, setLastSeen] = useState(0);
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [wifiMessage, setWifiMessage] = useState("");

  /* Live location state */
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    text: "Fetching location...",
    status: "locating", // locating | available | denied | unsupported | error
  });

  const watchIdRef = useRef(null);

  useEffect(() => {
    // Firebase listeners (unchanged)
    const statusRef = ref(db, "device/status");
    onValue(statusRef, (snap) => setStatus(snap.val() || "No data"));

    ["x", "y", "z"].forEach((axis) => {
      onValue(ref(db, `device/accel/${axis}`), (snap) =>
        setAccel((prev) => ({ ...prev, [axis]: snap.val() || 0 }))
      );
    });

    onValue(ref(db, "device/battery"), (snap) =>
      setBattery(snap.val() !== null ? `${snap.val()}%` : "Unknown")
    );
    onValue(ref(db, "device/lastSeen"), (snap) => setLastSeen(snap.val() || 0));
  }, []);

  /* Start watching geolocation on mount, and clear on unmount */
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocation((s) => ({ ...s, status: "unsupported", text: "Geolocation not supported" }));
      return;
    }

    const success = (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setLocation({
        latitude: lat,
        longitude: lng,
        text: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        status: "available",
      });
    };

    const error = (err) => {
      console.error("Geolocation error:", err);
      if (err.code === err.PERMISSION_DENIED) {
        setLocation((s) => ({ ...s, status: "denied", text: "Location permission denied" }));
      } else {
        setLocation((s) => ({ ...s, status: "error", text: "Unable to retrieve location" }));
      }
    };

    // watchPosition gives live updates when user moves
    const watchId = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    });
    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const now = Math.floor(Date.now() / 1000);
  const deviceOnline = now - lastSeen < 10;

  const handleWifiSave = async () => {
    if (!ssid || !password) {
      setWifiMessage("⚠️ Please enter both SSID and Password.");
      return;
    }
    try {
      await set(ref(db, "device/wifi"), { ssid, password });
      setWifiMessage("✅ Wi-Fi credentials sent to device!");
      setSsid("");
      setPassword("");
    } catch {
      setWifiMessage("❌ Failed to save Wi-Fi credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-28"> 
      {/* pb-28 ensures content won't be hidden behind the fixed bottom nav */}
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
          <Button variant="ghost" size="sm" className="text-white">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

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
              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="password"
              placeholder="Wi-Fi Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <Button
            onClick={handleWifiSave}
            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save Wi-Fi
          </Button>
          {wifiMessage && <p className="mt-2 text-sm text-gray-700">{wifiMessage}</p>}
        </div>

        {/* System Status Card */}
        <div className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
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
          </div>
        </div>

        {/* Accident Detection Card */}
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

        {/* === LIVE MAP CARD (replaces Recent Activity) === */}
        <div className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition">
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

          {/* Map area — responsive height and will not overlap bottom nav because of page padding */}
          <div className="w-full h-72 sm:h-96 md:h-[520px] overflow-hidden rounded-lg mt-4 relative">
            {/* Show a fallback message while waiting for location */}
            {location.status !== "available" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 text-center">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-gray-500 opacity-70" />
                  <p className="text-sm text-gray-700">
                    {location.status === "locating"
                      ? "Obtaining location..."
                      : location.text}
                  </p>
                  {location.status === "denied" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Please allow location in your browser settings.
                    </p>
                  )}
                </div>
              </div>
            )}

            <MapContainer
              center={
                location.latitude && location.longitude
                  ? [location.latitude, location.longitude]
                  : [14.5995, 120.9842] // fallback center (Manila)
              }
              zoom={15}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Recenter automatically when coords change */}
              <RecenterAutomatically lat={location.latitude} lng={location.longitude} />

              {/* Marker for user's current location */}
              {location.latitude && location.longitude && (
                <Marker position={[location.latitude, location.longitude]}>
                  <Popup>
                    You are here <br />
                    {location.text}
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {/* Small action bar under the map */}
          <div className="p-4 flex gap-3 items-center justify-between">
            <div className="text-sm text-gray-600">
              {location.latitude && location.longitude ? (
                <>
                  Lat: <span className="font-medium">{location.latitude.toFixed(6)}</span>{" "}
                  · Lon: <span className="font-medium">{location.longitude.toFixed(6)}</span>
                </>
              ) : (
                "Location not available"
              )}
            </div>

            <div className="flex gap-2">
              {/* Recenter button (sets the map view by updating state momentarily) */}
              <button
                onClick={() => {
                  if (location.latitude && location.longitude) {
                    // quick approach: dispatch a small state change so RecenterAutomatically runs
                    // We just re-set the same coords to trigger the map effect
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
                  location.latitude && location.longitude
                    ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
                    : "https://www.google.com/maps"
                }
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
              >
                Open in Maps
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-200 border-t border-gray-300">
        <div className="flex">
          <Link href="/dashboard" className="flex-1 py-3 px-4 text-center text-blue-600">
            <Home className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Home</span>
          </Link>

          <Link href="/emergency/services" className="flex-1 py-3 px-4 text-center text-gray-600">
            <Phone className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Hotline</span>
          </Link>

          <Link href="/dashboard/reports" className="flex-1 py-3 px-4 text-center text-gray-600">
            <AlertTriangle className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Reports</span>
          </Link>

          <Link href="/dashboard/profile" className="flex-1 py-3 px-4 text-center text-gray-600">
            <User className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
