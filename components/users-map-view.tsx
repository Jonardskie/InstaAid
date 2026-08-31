"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Users, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAllUserLocations } from "@/lib/firebase-service"
import { UserStatusIndicator } from "@/components/user-status-indicator"

interface UsersMapViewProps {
  accidents?: any[]
}

export function UsersMapView({ accidents = [] }: UsersMapViewProps) {
  const [userLocations, setUserLocations] = useState<Map<string, any>>(new Map())
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [hoveredUser, setHoveredUser] = useState<string | null>(null)
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())

  useEffect(() => {
    const loadUserLocations = async () => {
      const locations = await getAllUserLocations()
      setUserLocations(locations)
      console.log("[v0] Loaded user locations:", locations.size)
    }

    loadUserLocations()

    // Refresh every 10 seconds
    const interval = setInterval(loadUserLocations, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Prevent React Strict Mode double-initialization
    const container = mapContainer.current;
    if (container.hasChildNodes()) {
      return;
    }

    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.async = true
    script.onload = () => {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)

      const L = (window as any).L
      if (!L) return;

      // Double check initialization
      if (map.current) return;
      // In case Leaflet attached _leaflet_id already
      if ((container as any)._leaflet_id) {
        (container as any)._leaflet_id = null;
      }

      const mapInstance = L.map(container).setView([17.6582, 121.7548], 14)

      L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
        maxZoom: 19,
        minZoom: 1,
      }).addTo(mapInstance)

      map.current = mapInstance
    }
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!map.current) return

    const L = (window as any).L
    if (!L) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    // Add user location markers
    userLocations.forEach((userLocation, userId) => {
      const statusColor =
        userLocation.status === "online" ? "#22c55e" : userLocation.status === "busy" ? "#eab308" : "#9ca3af"

      const lat = Number(userLocation.latitude);
      const lng = Number(userLocation.longitude);

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: statusColor,
        color: "white",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      })
        .addTo(map.current)
        .bindPopup(`<strong>${userLocation.name}</strong><br/>${userLocation.status}`)
        .on("click", () => setSelectedUser(userId))
        .on("mouseover", () => setHoveredUser(userId))
        .on("mouseout", () => setHoveredUser(null))

      markersRef.current.set(userId, marker)
    })

    // Add accident location markers
    accidents.forEach((accident) => {
      const color =
        accident.severity === "critical"
          ? "#dc2626"
          : accident.severity === "high"
            ? "#ea580c"
            : accident.severity === "medium"
              ? "#eab308"
              : "#22c55e"

      const lat = Number(accident.location?.latitude || accident.latitude || (accident.coordinates ? parseFloat(accident.coordinates.split(',')[0]) : null));
      const lng = Number(accident.location?.longitude || accident.longitude || (accident.coordinates ? parseFloat(accident.coordinates.split(',')[1]) : null));

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const marker = L.circleMarker([lat, lng], {
        radius: 10,
        fillColor: color,
        color: "white",
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9,
        dashArray: "5, 5",
      })
        .addTo(map.current)
        .bindPopup(`<strong>Accident: ${accident.name || accident.user?.name || "Unknown"}</strong><br/>${accident.status}`)

      markersRef.current.set(`accident-${accident.id}`, marker)
    })

    // Fit bounds if there are markers
    if (markersRef.current.size > 0) {
      try {
        const group = L.featureGroup(Array.from(markersRef.current.values()))
        const bounds = group.getBounds()
        if (bounds && bounds.isValid && bounds.isValid()) {
          map.current.fitBounds(bounds.pad(0.1))
        }
      } catch (err) {
        console.error("Error setting map bounds", err)
      }
    }
  }, [userLocations, accidents])

  const onlineUsers = Array.from(userLocations.values()).filter((u) => u.status === "online").length
  const busyUsers = Array.from(userLocations.values()).filter((u) => u.status === "busy").length
  const offlineUsers = Array.from(userLocations.values()).filter((u) => u.status === "offline").length

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden flex flex-col md:flex-row">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <div ref={mapContainer} className="w-full h-full" />
      </div>

      {/* Top Stats Overlay */}
      <div className="absolute top-4 left-4 right-4 md:right-auto md:w-[400px] z-[1000] space-y-4 pointer-events-none">
        
        {/* Header Widget */}
        <Card className="shadow-lg border-0 bg-background/95 backdrop-blur-md pointer-events-auto">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xl font-bold tracking-tight">Fleet Command</CardTitle>
            <p className="text-xs text-muted-foreground">Real-time driver tracking</p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex justify-between items-center bg-muted/50 rounded-lg p-3">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-green-600">{onlineUsers}</span>
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">Online</span>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-yellow-600">{busyUsers}</span>
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">Busy</span>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-gray-500">{offlineUsers}</span>
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">Offline</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User List Panel (Hidden on very small screens, visible on md+) */}
        <Card className="hidden md:block shadow-lg border-0 bg-background/95 backdrop-blur-md pointer-events-auto flex-1 max-h-[calc(100vh-14rem)] overflow-hidden flex flex-col">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4" /> Active Personnel
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto">
            {userLocations.size === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <AlertCircle className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">No active tracking data</p>
              </div>
            ) : (
              <div className="divide-y">
                {Array.from(userLocations.values()).map((user) => (
                  <div
                    key={user.userId}
                    className={cn(
                      "flex flex-col gap-1 p-3 transition-colors hover:bg-muted/50 cursor-pointer",
                      selectedUser === user.userId ? "bg-primary/5" : "",
                      hoveredUser === user.userId ? "bg-muted" : "",
                    )}
                    onClick={() => {
                      setSelectedUser(user.userId)
                      if (map.current && user.latitude && user.longitude) {
                        map.current.setView([user.latitude, user.longitude], 16, { animate: true })
                      }
                    }}
                    onMouseEnter={() => setHoveredUser(user.userId)}
                    onMouseLeave={() => setHoveredUser(null)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm truncate pr-2">{user.name}</div>
                      <UserStatusIndicator
                        userId={user.userId}
                        userName={user.name}
                        className="scale-75 origin-right"
                      />
                    </div>
                    {user.phone && user.phone !== "N/A" && (
                      <div className="text-xs text-muted-foreground">{user.phone}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Floating Crosshair / Re-center (Bottom Right) */}
      <div className="absolute bottom-6 right-6 z-[1000] pointer-events-auto">
        <button 
          onClick={() => {
            if (markersRef.current.size > 0 && map.current) {
              const group = (window as any).L.featureGroup(Array.from(markersRef.current.values()));
              const bounds = group.getBounds();
              if (bounds && bounds.isValid && bounds.isValid()) {
                map.current.fitBounds(bounds.pad(0.1));
              }
            }
          }}
          className="bg-white p-3 rounded-full shadow-lg border hover:bg-gray-50 flex items-center justify-center transition-transform active:scale-95"
          title="Recenter Map"
        >
          <MapPin className="h-6 w-6 text-[#173C94]" />
        </button>
      </div>
    </div>
  )
}
