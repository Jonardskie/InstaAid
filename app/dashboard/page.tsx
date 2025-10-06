"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Home, Phone, AlertTriangle, User, Settings } from "lucide-react";
import Link from "next/link";

/* Firebase */
import { auth, rtdb, db } from "@/lib/firebase";
import { ref, onValue, set } from "firebase/database";
import { doc, setDoc } from "firebase/firestore";

/* Leaflet / React-Leaflet */
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

/* Fix for default icon URLs */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

/* Helper: recenter the map when coords update */
function RecenterAutomatically({
  lat,
  lng,
}: {
  lat: number | null;
  lng: number | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

export default function DashboardPage() {
  const [status, setStatus] = useState("Loading...");
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 });
  const [battery, setBattery] = useState("Unknown");
  const [lastSeen, setLastSeen] = useState(0);
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [deviceIp, setDeviceIp] = useState("");
  const [wifiMessage, setWifiMessage] = useState("");
  const [testing, setTesting] = useState(false);

  /* Live location state */
  const [location, setLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    text: string;
    status: string;
  }>({
    latitude: null,
    longitude: null,
    text: "Fetching location...",
    status: "locating",
  });

  const watchIdRef = useRef<number | null>(null);

  /* Realtime rtdb listeners */
  useEffect(() => {
    const statusRef = ref(rtdb, "device/status");
    onValue(statusRef, (snap) => setStatus(snap.val() || "No data"));

    ["x", "y", "z"].forEach((axis) => {
      onValue(ref(rtdb, `device/accel/${axis}`), (snap) =>
        setAccel((prev) => ({ ...prev, [axis]: snap.val() || 0 }))
      );
    });

    onValue(ref(rtdb, "device/battery"), (snap) =>
      setBattery(snap.val() !== null ? `${snap.val()}%` : "Unknown")
    );
    onValue(ref(rtdb, "device/lastSeen"), (snap) =>
      setLastSeen(snap.val() || 0)
    );
  }, []);

  /* Geolocation */
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocation((s) => ({
        ...s,
        status: "unsupported",
        text: "Geolocation not supported",
      }));
      return;
    }

    const success = async (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setLocation({
        latitude: lat,
        longitude: lng,
        text: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        status: "available",
      });

      if (auth.currentUser) {
        await setDoc(
          doc(db, "users", auth.currentUser.uid),
          {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            name: auth.currentUser.displayName || "Anonymous",
            location: { latitude: lat, longitude: lng },
            lastUpdated: new Date(),
          },
          { merge: true }
        );
      }
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

    return () => {
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const now = Math.floor(Date.now() / 1000);
  const deviceOnline = now - lastSeen < 10;

  // Build target URL
  const getTargetUrl = (path = "/setwifi") => {
    const trimmed = deviceIp.trim();
    if (trimmed) {
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return `${trimmed.replace(/\/+$/, "")}${path}`;
      }
      return `http://${trimmed}${path}`;
    }
    return `http://192.168.4.1${path}`;
  };

  // Test device reachable
  const testDevice = async () => {
    setTesting(true);
    setWifiMessage("");
    try {
      const url = getTargetUrl("/");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(url, { method: "GET", signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        setWifiMessage(`⚠️ Device responded ${res.status}`);
      } else {
        const text = await res.text();
        setWifiMessage(`✅ Device reachable: ${text.slice(0, 60)}`);
        if (!deviceIp) {
          setDeviceIp("192.168.4.1");
          try {
            localStorage.setItem("esp32_device_ip", "192.168.4.1");
          } catch (_) {}
        }
      }
    } catch (err) {
      setWifiMessage(
        "❌ Not reachable. Make sure your phone/PC is connected to the ESP32 Wi-Fi (ESP32_Setup)."
      );
      console.error(err);
    } finally {
      setTesting(false);
    }
  };

  // Save Wi-Fi credentials
  const handleWifiSave = async () => {
    if (!ssid || !password) {
      setWifiMessage("⚠️ Please enter both SSID and Password.");
      return;
    }

    setWifiMessage("⏳ Attempting to send credentials to device...");

    const url = getTargetUrl("/setwifi");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssid, password }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      let parsed = null;
      try {
        parsed = await resp.json();
      } catch {
        parsed = null;
      }

      if (resp.ok && parsed && parsed.success) {
        setWifiMessage(
          "✅ Wi-Fi credentials sent to ESP32! Device will restart and try to connect."
        );
        setSsid("");
        setPassword("");
        return;
      } else {
        throw new Error(parsed?.message || `Device returned ${resp.status}`);
      }
    } catch (err) {
      console.warn("Direct provisioning failed:", err);
      try {
        await set(ref(rtdb, "device/wifi"), {
          ssid,
          password,
          provisionedAt: Date.now(),
        });
        setWifiMessage(
          "⚠️ Direct provisioning failed — credentials saved to Firebase as fallback."
        );
        setSsid("");
        setPassword("");
      } catch (fbErr) {
        console.error("Firebase fallback failed", fbErr);
        setWifiMessage(
          "❌ Direct provisioning failed and failed to write to Firebase."
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-28">
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
          <Button variant="ghost" size="sm" className="text-white">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Wi-Fi Setup */}
        <div className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Wi-Fi Setup
          </h2>

          <div className="mb-3">
            <label className="text-sm text-gray-600 block mb-1">
              Device IP (optional)
            </label>
            <div className="flex gap-2">
              <input
                value={deviceIp}
                onChange={(e) => setDeviceIp(e.target.value)}
                placeholder="e.g. 192.168.0.55 or leave blank for 192.168.4.1 (AP)"
                className="flex-1 bg-gray-50 border p-2 rounded-lg"
              />
              <Button onClick={testDevice} disabled={testing}>
                {testing ? "Testing..." : "Test"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Connect your phone to the ESP32 AP (ESP32_Setup) to provision;
              default AP IP is <code>192.168.4.1</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              placeholder="Wi-Fi SSID"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              className="w-full bg-gray-50 border p-2 rounded-lg"
            />
            <input
              placeholder="Wi-Fi Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border p-2 rounded-lg"
            />
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              onClick={handleWifiSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Wi-Fi
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSsid("");
                setPassword("");
                setWifiMessage("");
              }}
            >
              Clear
            </Button>
          </div>

          {wifiMessage && (
            <p className="mt-3 text-sm text-gray-700">{wifiMessage}</p>
          )}
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

        {/* Live Map */}
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

          <div className="w-full h-72 sm:h-96 md:h-[520px] overflow-hidden rounded-lg mt-4 relative">
            <MapContainer
              center={
                location.latitude && location.longitude
                  ? [location.latitude, location.longitude]
                  : [14.5995, 120.9842]
              }
              zoom={15}
              scrollWheelZoom={false}
              style={{ height: "100%", width: "100%" }}
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
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-200 border-t border-gray-300">
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
            <Phone className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Hotline</span>
          </Link>
          <Link
            href="/dashboard/reports"
            className="flex-1 py-3 px-4 text-center text-gray-600"
          >
            <AlertTriangle className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Reports</span>
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
  );
}
