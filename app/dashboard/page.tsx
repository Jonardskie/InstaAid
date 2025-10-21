"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import dynamic from "next/dynamic"
import type { Map as LeafletMap } from "leaflet"
import { Button } from "@/components/ui/button"
import { Home, AlertTriangle, User, MapPin, Mail, XCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { rtdb } from "@/lib/firebase"
import { ref, onValue, set, type Unsubscribe } from "firebase/database"

// Dynamically import the Map component with no SSR
const MapComponent = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <p>Loading map...</p>
    </div>
  ),
})