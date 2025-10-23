"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Home, MessageSquare, User } from "lucide-react";

const tabs = [
  { id: "home", icon: <Home size={22} />, label: "Home" },
  { id: "message", icon: <MessageSquare size={22} />, label: "Message" },
  { id: "profile", icon: <User size={22} />, label: "Profile" },
];

export default function AnimatedNavbar() {
  const [active, setActive] = useState("home");

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white rounded-2xl px-6 py-3 shadow-lg flex items-center justify-between w-[280px]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActive(tab.id)}
          className="relative flex flex-col items-center justify-center w-full"
        >
          {active === tab.id && (
            <motion.div
              layoutId="bubble"
              className="absolute -top-4 bg-orange-500 rounded-full p-3"
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          )}
          <motion.div
            className={`z-10 transition-colors ${
              active === tab.id ? "text-white" : "text-gray-400"
            }`}
          >
            {tab.icon}
          </motion.div>
        </button>
      ))}
    </div>
  );
}
