"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { Home, AlertTriangle, User, Settings, MapPin, Mail } from "lucide-react";
=======
import { Home, Phone, Mail, AlertTriangle, User, Settings, MapPin } from "lucide-react";
>>>>>>> 9f5d08fc500ac33ee5d83fbcac314b3cff3a8bb3
import Link from "next/link";
import { getRtdb } from "../../lib/firebase";
import { ref, onValue, set } from "firebase/database";

/* Leaflet / React-Leaflet */
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L, { type LatLngExpression, type Marker as LeafletMarker } from "leaflet";
import 'leaflet/dist/leaflet.css';

/* Fix for default icon URLs (use CDN links for stability) */
delete (L.Icon.Default as unknown as { prototype: { _getIconUrl?: unknown } }).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

/* Fix marker icons after mount */
function useEnsureLeafletCss() {
  useEffect(() => {
    if (typeof lat === "number" && typeof lng === "number") {
      map.setView([lat, lng] as LatLngExpression, map.getZoom(), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
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
  const [isOpen, setIsOpen] = useState(false);

  const [settings, setSettings] = useState({
    accidentAlert: true,
    emergencyCall: true,
    gpsTracking: true,
    pushNotifications: true,
  });

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  useEffect(() => {
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

<<<<<<< HEAD
  /* ✅ Updated Geolocation */
  useEffect(() => {
=======
  /* Start/Stop Geolocation */
  const startTracking = () => {
>>>>>>> 9f5d08fc500ac33ee5d83fbcac314b3cff3a8bb3
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

      // Update React state
      setLocation({
        latitude: lat,
        longitude: lng,
        text: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        status: "available",
      });

      // ✅ Sync to Firebase
      set(ref(db, "device/location"), {
        latitude: lat,
        longitude: lng,
        timestamp: Date.now(),
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
      }
    };

    const watchId = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
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

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-200">
      {/* 📱 Phone Frame */}
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-[375px] h-[812px] overflow-hidden border-[10px] border-gray-800">
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
                <button
                  onClick={() => setIsOpen(true)}
                  className="flex-1 py-3 px-4 text-center text-white"
                >
                  <Settings className="w-6 h-6 mx-auto mb-1" />
                </button>

                {/* Pop-up Modal */}
                {isOpen && (
                  <div className="absolute top-10 right-10 w-64 bg-none p-4 rounded shadow z-50">
                    <div className="bg-white rounded-xl p-6 w-70 shadow-lg relative">
                      <h2 className="text-xl font-bold mb-4 text-gray-500">
                        System Settings
                      </h2>

                      <div className="space-y-3">
                        {Object.keys(settings).map((key) => (
                          <div
                            key={key}
                            className="flex justify-between items-center text-gray-500"
                          >
                            <span className="capitalize">
                              {key.replace(/([A-Z])/g, " $1")}
                            </span>
                            <input
                              type="checkbox"
                              checked={settings[key]}
                              onChange={() => toggleSetting(key)}
                              className="w-5 h-5"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Close Button */}
                      <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 font-bold text-3xl p-1"
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

<<<<<<< HEAD
          {/* Wi-Fi Setup Card */}
          <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
            <div className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Wi-Fi Setup
              </h2>
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
          >
            Save Wi-Fi
          </Button>
          {wifiMessage && (
            <p className="mt-2 text-sm text-gray-700">{wifiMessage}</p>
          )}
        </div>

        {/* Live Map Card */}
        <div className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition">
          <div className="p-5 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Live Location Map
            </h2>
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
>>>>>>> 9f5d08fc500ac33ee5d83fbcac314b3cff3a8bb3
              >
                Save Wi-Fi
              </Button>
              {wifiMessage && (
                <p className="mt-2 text-sm text-gray-700">{wifiMessage}</p>
              )}
            </div>

            {/* Live Location Map */}
            <div className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition">
              <div className="p-5 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Live Location Map
                </h2>
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

              <div className="w-full h-72 sm:h-96 md:h-[520px] overflow-hidden rounded-lg mt-4 relative mb-28">
                {location.status !== "available" && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div>
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
                      : [14.5995, 120.9842]
                  }
                  zoom={15}
                  scrollWheelZoom={false}
                  tap={false}
                  style={{ height: "100%", width: "100%" }}
                  className="z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <RecenterAutomatically
                    lat={location.latitude}
                    lng={location.longitude}
                  />
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

              {/* Map controls */}
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
              </div>
<<<<<<< HEAD
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition">
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

            {/* Accident Detection */}
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
          <div className="absolute bottom-0 left-0 right-0 bg-gray-200 border-t border-gray-300 z-10">
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
=======
            )}

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
          </div>
        </div>

        {/* System Status Card */}
        <div className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">Device</p>
              <p
                className={`mt-1 font-medium ${
                  deviceOnline ? "text-green-600" : "text-red-600"
                }`}
>>>>>>> 9f5d08fc500ac33ee5d83fbcac314b3cff3a8bb3
              >
                <Mail className="w-6 h-6 mx-auto mb-1" />
                <span className="text-xs">Message</span>
              </Link>

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
<<<<<<< HEAD
=======

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
>>>>>>> 9f5d08fc500ac33ee5d83fbcac314b3cff3a8bb3
      </div>
    </div>
  );
}
