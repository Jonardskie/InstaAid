"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { database } from "@/lib/firebase-config";
import { ref, onValue } from "firebase/database";

type AdminLiveMapProps = {
  initialLat: number;
  initialLng: number;
};

export function AdminLiveMap({ initialLat, initialLng }: AdminLiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<any | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const [livePos, setLivePos] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });

  useEffect(() => {
    // Load Leaflet dynamically to avoid SSR issues
    const loadDependencies = async () => {
      if (!document.querySelector('link[href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"]')) {
        const link = document.createElement("link");
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }

      if (!document.querySelector('script[src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"]')) {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        await new Promise((resolve) => {
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }
      setIsMapReady(true);
    };

    loadDependencies();
  }, []);

  useEffect(() => {
    if (!isMapReady) return;

    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView([initialLat, initialLng], 17);

      L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
      }).addTo(mapInstanceRef.current);

      const pulseIcon = L.divIcon({
        className: "custom-div-icon",
        html: `
          <div class="relative flex h-5 w-5 items-center justify-center">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex h-4 w-4 rounded-full bg-red-600 border-2 border-white shadow"></span>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      markerRef.current = L.marker([initialLat, initialLng], {
        icon: pulseIcon,
      }).addTo(mapInstanceRef.current);
    }
  }, [initialLat, initialLng, isMapReady]);

  // Listen to live GPS from the driver
  useEffect(() => {
    const locRef = ref(database, "device/location");
    const unsubscribe = onValue(locRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.latitude && data.longitude) {
          setLivePos({ lat: data.latitude, lng: data.longitude });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Update marker when livePos changes
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([livePos.lat, livePos.lng]);
      mapInstanceRef.current.panTo([livePos.lat, livePos.lng]);
    }
  }, [livePos.lat, livePos.lng]);

  return (
    <div className="relative h-[250px] w-full overflow-hidden rounded-xl border border-gray-200 mt-3 mb-2">
      <div ref={mapContainerRef} className="h-full w-full relative z-0" />
      <div className="absolute top-2 left-2 z-[1000] rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-red-600 shadow-md backdrop-blur-md flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        LIVE TRACKING
      </div>
    </div>
  );
}
