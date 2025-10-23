"use client";

import { useEffect, useRef, useState } from "react";

type Poi = {
  lat: number;
  lon: number;
  name: string;
};

type MapComponentProps = {
  center?: [number, number];
  zoom?: number;
  userPosition?: [number, number];
  pois: Poi[];
  destination: [number, number] | null;
  onMapInstance?: (map: any) => void;
  onPoiClick?: (lat: number, lon: number) => void;
};

const MapComponent = ({
  center = [14.5995, 120.9842],
  zoom = 13,
  userPosition,
  pois = [],
  destination = null,
  onMapInstance,
  onPoiClick,
}: MapComponentProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<'light' | 'dark' | 'satellite'>('light');

  const mapInstanceRef = useRef<any | null>(null);
  const userMarkerRef = useRef<any | null>(null);
  const routingControlRef = useRef<any | null>(null);
  const poiMarkersRef = useRef<any[]>([]);

  // Map style configurations
  const mapStyles = {
    light: {
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    dark: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
    }
  };

  // Custom icons with better design
  const createUserIcon = (L: any) => L.divIcon({
    html: `
      <div class="relative">
        <div class="absolute inset-0 animate-ping bg-blue-400 rounded-full opacity-75"></div>
        <div class="relative flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full border-3 border-white shadow-lg">
          <div class="w-2 h-2 bg-white rounded-full"></div>
        </div>
        <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-500"></div>
      </div>
    `,
    className: "bg-transparent border-none",
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  });

  const createHospitalIcon = (L: any) => L.divIcon({
    html: `
      <div class="relative group">
        <div class="flex items-center justify-center w-10 h-10 bg-red-500 rounded-full border-3 border-white shadow-lg hover:scale-110 transition-transform duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s-8-4.5-8-11.5A8 8 0 0 1 12 2.5a8 8 0 0 1 8 8.5c0 7-8 11.5-8 11.5z"/>
            <path d="m9 10 6 6m-6 0 6-6"/>
          </svg>
        </div>
        <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500"></div>
        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap z-50">
          Click for directions
        </div>
      </div>
    `,
    className: "bg-transparent border-none",
    iconSize: [40, 48],
    iconAnchor: [20, 48],
  });

  const createDestinationIcon = (L: any) => L.divIcon({
    html: `
      <div class="relative">
        <div class="flex items-center justify-center w-10 h-10 bg-green-500 rounded-full border-3 border-white shadow-lg animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
        <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-500"></div>
      </div>
    `,
    className: "bg-transparent border-none",
    iconSize: [40, 48],
    iconAnchor: [20, 48],
  });

  // Load Leaflet and dependencies
  useEffect(() => {
    let mounted = true;

    const loadMap = async () => {
      try {
        setIsLoading(true);
        
        // Load CSS first
        await loadCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
        
        // Load Leaflet JS
        await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
        
        if (!mounted) return;

        const L = (window as any).L;
        if (!L || !mapContainerRef.current) {
          throw new Error("Failed to load Leaflet");
        }

        // Initialize map with better defaults
        const map = L.map(mapContainerRef.current, {
          zoomControl: false, // We'll add custom controls
          fadeAnimation: true,
          zoomAnimation: true,
        }).setView(center, zoom);

        // Add custom zoom control
        L.control.zoom({
          position: 'topright'
        }).addTo(map);

        // Add scale control
        L.control.scale({
          imperial: false,
          position: 'bottomleft'
        }).addTo(map);

        // Add initial tile layer
        const tileLayer = L.tileLayer(mapStyles[mapStyle].url, {
          attribution: mapStyles[mapStyle].attribution,
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        if (onMapInstance) onMapInstance(map);

        setIsLoading(false);

      } catch (err) {
        console.error("Failed to load map:", err);
        if (mounted) {
          setError("Failed to load map. Please refresh the page.");
          setIsLoading(false);
        }
      }
    };

    loadMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map style
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Remove existing tile layers
    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    // Add new tile layer
    L.tileLayer(mapStyles[mapStyle].url, {
      attribution: mapStyles[mapStyle].attribution,
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

  }, [mapStyle]);

  // Update user position with smooth animation
  useEffect(() => {
    if (!mapInstanceRef.current || !userPosition) return;

    const L = (window as any).L;
    if (!L) return;

    const userIcon = createUserIcon(L);

    if (userMarkerRef.current) {
      // Smooth transition to new position
      userMarkerRef.current.setLatLng(userPosition);
    } else {
      userMarkerRef.current = L.marker(userPosition, { 
        icon: userIcon,
        zIndexOffset: 1000 
      })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="text-center">
            <div class="font-semibold text-blue-600">Your Location</div>
            <div class="text-sm text-gray-600">${userPosition[0].toFixed(4)}, ${userPosition[1].toFixed(4)}</div>
          </div>
        `);
    }

    // Smooth pan to user location when no destination
    if (!destination) {
      mapInstanceRef.current.panTo(userPosition, {
        animate: true,
        duration: 1.5
      });
    }
  }, [userPosition, destination]);

  // Update POIs with clustering and better popups
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Clear existing POI markers
    poiMarkersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    poiMarkersRef.current = [];

    // Add new POIs with better clustering visualization
    pois.forEach((poi) => {
      const hospitalIcon = createHospitalIcon(L);

      const marker = L.marker([poi.lat, poi.lon], { 
        icon: hospitalIcon 
      })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="min-w-40">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-3 h-3 bg-red-500 rounded-full"></div>
              <h3 class="font-semibold text-gray-900">${poi.name}</h3>
            </div>
            <div class="text-sm text-gray-600 mb-3">
              ${poi.lat.toFixed(4)}, ${poi.lon.toFixed(4)}
            </div>
            <button 
              onclick="window.dispatchEvent(new CustomEvent('getDirections', { detail: { lat: ${poi.lat}, lon: ${poi.lon} } }))"
              class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            >
              Get Directions
            </button>
          </div>
        `);

      // Add click event for directions
      marker.on('click', () => {
        if (onPoiClick) {
          onPoiClick(poi.lat, poi.lon);
        }
      });

      // Add hover effects
      marker.on('mouseover', function() {
        this.openPopup();
      });

      poiMarkersRef.current.push(marker);
    });
  }, [pois, onPoiClick]);

  // Enhanced routing with better visuals
  useEffect(() => {
    if (!mapInstanceRef.current || !userPosition || !destination) {
      if (routingControlRef.current) {
        mapInstanceRef.current?.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
      return;
    }

    const L = (window as any).L;
    if (!L?.Routing?.control) {
      loadScript("https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js")
        .then(() => loadCSS("https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css"))
        .then(() => {
          setTimeout(() => {
            if (mapInstanceRef.current && userPosition && destination) {
              updateRoute();
            }
          }, 100);
        });
      return;
    }

    updateRoute();

    function updateRoute() {
      if (routingControlRef.current) {
        mapInstanceRef.current.removeControl(routingControlRef.current);
      }

      const L = (window as any).L;
      
      // Add destination marker
      const destinationIcon = createDestinationIcon(L);
      L.marker(destination, { icon: destinationIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="text-center">
            <div class="font-semibold text-green-600">Destination</div>
            <div class="text-sm text-gray-600">${destination[0].toFixed(4)}, ${destination[1].toFixed(4)}</div>
          </div>
        `)
        .openPopup();

      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(userPosition[0], userPosition[1]),
          L.latLng(destination[0], destination[1]),
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        fitSelectedRoutes: true,
        show: false, // Hide instructions panel
        lineOptions: {
          styles: [
            { 
              color: '#007BFF', 
              opacity: 0.8, 
              weight: 6,
              className: 'route-line'
            }
          ],
        },
        createMarker: () => null, // We create our own markers
      }).addTo(mapInstanceRef.current);

      // Smooth fly to show both points
      const bounds = L.latLngBounds([userPosition, destination]);
      mapInstanceRef.current.flyToBounds(bounds, { 
        padding: [50, 50],
        duration: 2 
      });
    }
  }, [userPosition, destination]);

  // Map style switcher component
  const MapStyleSwitcher = () => (
    <div className="absolute top-4 left-4 z-30 bg-white rounded-lg shadow-lg p-2">
      <div className="flex gap-2">
        {(['light', 'dark', 'satellite'] as const).map((style) => (
          <button
            key={style}
            onClick={() => setMapStyle(style)}
            className={`p-2 rounded-md transition-all ${
              mapStyle === style 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={`Switch to ${style} map`}
          >
            {style === 'light' && '🗺️'}
            {style === 'dark' && '🌙'}
            {style === 'satellite' && '🛰️'}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading map...</p>
              <p className="text-sm text-gray-500 mt-1">Preparing your navigation experience</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-20">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Loading Failed</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Map Controls */}
      <MapStyleSwitcher />
      
      {/* Loading indicator for POIs */}
      {pois.length === 0 && !isLoading && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500"></div>
              Searching for nearby hospitals...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const loadCSS = (href: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve();
      return;
    }
    const link = document.createElement("link");
    link.href = href;
    link.rel = "stylesheet";
    link.onload = () => resolve();
    link.onerror = reject;
    document.head.appendChild(link);
  });
};

export default MapComponent;