"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Home, Phone, AlertTriangle, User, Settings } from "lucide-react";
import Link from "next/link";
import { db } from "../../lib/firebase";
import { ref, onValue, set } from "firebase/database";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("home");
  const [status, setStatus] = useState("Loading...");
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 });
  const [battery, setBattery] = useState("Unknown");
  const [lastSeen, setLastSeen] = useState(0);
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [wifiMessage, setWifiMessage] = useState("");

  useEffect(() => {
    // Device status
    const statusRef = ref(db, "device/status");
    onValue(statusRef, (snap) => setStatus(snap.val() || "No data"));

    // Accelerometer
    ["x", "y", "z"].forEach((axis) => {
      onValue(ref(db, `device/accel/${axis}`), (snap) =>
        setAccel((prev) => ({ ...prev, [axis]: snap.val() || 0 }))
      );
    });

    // Battery
    onValue(ref(db, "device/battery"), (snap) =>
      setBattery(snap.val() !== null ? `${snap.val()}%` : "Unknown")
    );

    // Last seen
    onValue(ref(db, "device/lastSeen"), (snap) => setLastSeen(snap.val() || 0));
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
    <div className="min-h-screen bg-gray-100">

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

        {/* Recent Activity Card */}
        <div className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-60" />
          <p className="text-gray-600 text-lg font-medium">No recent emergency reports</p>
          <p className="text-gray-400 mt-1 text-sm">Stay safe on the road!</p>
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
