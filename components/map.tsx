"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Leaflet icon initialization
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  })
}

interface MapComponentProps {
  center: [number, number]
  zoom: number
  markerPosition?: [number, number]
  markerPopup?: string
  onMapInstance?: (map: L.Map) => void
}

export default function MapComponent({
  center,
  zoom,
  markerPosition,
  markerPopup,
  onMapInstance,
}: MapComponentProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
      ref={onMapInstance ? (map) => map && onMapInstance(map) : undefined}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
      />
      {markerPosition && (
        <Marker position={markerPosition}>
          {markerPopup && <Popup>{markerPopup}</Popup>}
        </Marker>
      )}
    </MapContainer>
  )
}