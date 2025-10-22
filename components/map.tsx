"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapComponent = ({ center = [14.5995, 120.9842], zoom = 13 }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // ✅ Prevent reinitialization if map already exists
    if (mapInstanceRef.current || !mapContainerRef.current) return;

    // Initialize map manually (not via JSX)
    const map = L.map(mapContainerRef.current).setView(center, zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.marker(center).addTo(map).bindPopup("You are here!").openPopup();

    mapInstanceRef.current = map;

    return () => {
      map.remove(); // ✅ Clean up on unmount
      mapInstanceRef.current = null;
    };
  }, [center, zoom]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        height: "100%",
        width: "100%",
        borderRadius: "1rem",
        overflow: "hidden",
      }}
    />
  );
};

export default MapComponent;
