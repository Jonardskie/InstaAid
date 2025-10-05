"use client";

import { useState } from "react";

export default function SettingPage() {
  const [isOpen, setIsOpen] = useState(false);

  // State for each setting
  const [settings, setSettings] = useState({
    accidentAlert: true,
    emergencyCall: true,
    gpsTracking: false,
    pushNotifications: true,
  });

  // Toggle individual settings
  const toggleSetting = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      {/* Open Settings Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Open Settings
      </button>

      {/* Pop-up Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg relative">
            <h2 className="text-xl font-bold mb-4">System Settings</h2>

            {/* Settings Options */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Accident Alerts</span>
                <input
                  type="checkbox"
                  checked={settings.accidentAlert}
                  onChange={() => toggleSetting("accidentAlert")}
                  className="w-5 h-5"
                />
              </div>

              <div className="flex justify-between items-center">
                <span>Emergency Call</span>
                <input
                  type="checkbox"
                  checked={settings.emergencyCall}
                  onChange={() => toggleSetting("emergencyCall")}
                  className="w-5 h-5"
                />
              </div>

              <div className="flex justify-between items-center text-black">
                <span>GPS Tracking</span>
                <input
                  type="checkbox"
                  checked={settings.gpsTracking}
                  onChange={() => toggleSetting("gpsTracking")}
                  className="w-5 h-5"
                />
              </div>

              <div className="flex justify-between items-center">
                <span>Push Notifications</span>
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={() => toggleSetting("pushNotifications")}
                  className="w-5 h-5"
                />
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-black hover:text-gray-900 font-bold text-lg"
            >
              &times;
            </button>

            {/* Save Button */}
            <button
              onClick={() => {
                alert("Settings saved!");
                setIsOpen(false);
              }}
              className="mt-5 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
