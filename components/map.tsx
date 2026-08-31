"use client";

import { useEffect, useRef, useState } from "react";
import { Navigation, Search, MapPin, Check, X, Loader2, Route } from "lucide-react";

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
  onLocationAdjusted?: (lat: number, lon: number) => void;
};

const MapComponent = ({
  center = [14.5995, 120.9842],
  zoom = 13,
  userPosition,
  pois = [],
  destination = null,
  onMapInstance,
  onPoiClick,
  onLocationAdjusted,
}: MapComponentProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<"light" | "dark" | "satellite">("light");
  const [isAdjustingLocation, setIsAdjustingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; time: string } | null>(null);

  const mapInstanceRef = useRef<any | null>(null);
  const userMarkerRef = useRef<any | null>(null);
  const routingControlRef = useRef<any | null>(null);
  const poiMarkersRef = useRef<any[]>([]);
  const destinationMarkerRef = useRef<any | null>(null);

  const mapStyles = {
    light: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      attribution:
        '&copy; <a href="https://www.esri.com/">Esri</a>',
    },
    dark: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      attribution:
        '&copy; <a href="https://www.esri.com/">Esri</a>',
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    },
  };

  const createUserIcon = (L: any) =>
    L.divIcon({
      html: `
        <div class="relative">
          <div class="absolute inset-0 animate-ping bg-blue-400 rounded-full opacity-75"></div>
          <div class="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded-full border-[3px] border-white shadow-lg">
            <div class="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-500"></div>
        </div>
      `,
      className: "bg-transparent border-none",
      iconSize: [32, 40],
      iconAnchor: [16, 40],
    });

  const createHospitalIcon = (L: any) =>
    L.divIcon({
      html: `
        <div class="relative group">
          <div class="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-full border-[3px] border-white shadow-lg hover:scale-110 transition-transform duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s-8-4.5-8-11.5A8 8 0 0 1 12 2.5a8 8 0 0 1 8 8.5c0 7-8 11.5-8 11.5z"/>
              <path d="m9 10 6 6m-6 0 6-6"/>
            </svg>
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500"></div>
        </div>
      `,
      className: "bg-transparent border-none",
      iconSize: [36, 44],
      iconAnchor: [18, 44],
    });

  const createDestinationIcon = (L: any) =>
    L.divIcon({
      html: `
        <div class="relative">
          <div class="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full border-[3px] border-white shadow-lg animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-500"></div>
        </div>
      `,
      className: "bg-transparent border-none",
      iconSize: [36, 44],
      iconAnchor: [18, 44],
    });

  const centerToUser = () => {
    if (!mapInstanceRef.current || !userPosition) return;

    mapInstanceRef.current.setView(userPosition, 16, {
      animate: true,
      duration: 0.5,
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapContainerRef.current.style.touchAction = "none";
    mapContainerRef.current.style.userSelect = "none";
    mapContainerRef.current.style.webkitUserSelect = "none";
  }, []);

  useEffect(() => {
    let mounted = true;
    let touchStartHandler: ((e: TouchEvent) => void) | null = null;
    let touchMoveHandler: ((e: TouchEvent) => void) | null = null;
    let touchEndHandler: (() => void) | null = null;
    let wheelHandler: ((e: WheelEvent) => void) | null = null;

    const loadMap = async () => {
      try {
        setIsLoading(true);

        await loadCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
        await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");

        if (!mounted) return;

        const L = (window as any).L;

        if (!L || !mapContainerRef.current) {
          throw new Error("Failed to load Leaflet");
        }

        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          dragging: true,
          inertia: true,
          inertiaDeceleration: 2500,
          inertiaMaxSpeed: 2000,
          easeLinearity: 0.25,
          touchZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          scrollWheelZoom: true,
          tap: false,
          keyboard: false,
          fadeAnimation: true,
          zoomAnimation: true,
          markerZoomAnimation: true,
        }).setView(center, zoom);

        L.control
          .scale({
            imperial: false,
            position: "bottomleft",
          })
          .addTo(map);

        L.tileLayer(mapStyles[mapStyle].url, {
          attribution: mapStyles[mapStyle].attribution,
          maxZoom: 19,
        }).addTo(map);

        const container = map.getContainer();

        touchStartHandler = (e: TouchEvent) => {
          if (e.touches.length === 2) {
            map.touchZoom.enable();
          } else {
            map.touchZoom.disable();
          }
        };

        touchMoveHandler = (e: TouchEvent) => {
          if (e.touches.length === 1) {
            map.dragging.enable();
            map.touchZoom.disable();
          }

          if (e.touches.length === 2) {
            map.touchZoom.enable();
          }
        };

        touchEndHandler = () => {
          map.touchZoom.disable();
          map.dragging.enable();
        };

        wheelHandler = (e: WheelEvent) => {
          if (!e.ctrlKey && !e.metaKey) return;
          e.preventDefault();
        };

        container.addEventListener("touchstart", touchStartHandler, {
          passive: true,
        });
        container.addEventListener("touchmove", touchMoveHandler, {
          passive: true,
        });
        container.addEventListener("touchend", touchEndHandler, {
          passive: true,
        });
        container.addEventListener("wheel", wheelHandler, {
          passive: false,
        });

        mapInstanceRef.current = map;
        onMapInstance?.(map);

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

      const map = mapInstanceRef.current;
      const container = map?.getContainer?.();

      if (container) {
        if (touchStartHandler) {
          container.removeEventListener("touchstart", touchStartHandler);
        }
        if (touchMoveHandler) {
          container.removeEventListener("touchmove", touchMoveHandler);
        }
        if (touchEndHandler) {
          container.removeEventListener("touchend", touchEndHandler);
        }
        if (wheelHandler) {
          container.removeEventListener("wheel", wheelHandler);
        }
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    L.tileLayer(mapStyles[mapStyle].url, {
      attribution: mapStyles[mapStyle].attribution,
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);
  }, [mapStyle]);

  useEffect(() => {
    if (!mapInstanceRef.current || !userPosition) return;

    const L = (window as any).L;
    if (!L) return;

    if (isAdjustingLocation) return; // Don't snap back to GPS while user is dragging

    const userIcon = createUserIcon(L);

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userPosition);
      userMarkerRef.current.setPopupContent(`
        <div class="text-center">
          <div class="font-semibold text-blue-600">Your Location</div>
          <div class="text-sm text-gray-600">
            ${userPosition[0].toFixed(4)}, ${userPosition[1].toFixed(4)}
          </div>
        </div>
      `);
    } else {
      userMarkerRef.current = L.marker(userPosition, {
        icon: userIcon,
        zIndexOffset: 1000,
        draggable: false, // Default false, toggled when adjusting
      })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="text-center">
            <div class="font-semibold text-blue-600">Your Location</div>
            <div class="text-sm text-gray-600">
              ${userPosition[0].toFixed(4)}, ${userPosition[1].toFixed(4)}
            </div>
          </div>
        `);
    }
  }, [userPosition?.[0], userPosition?.[1], isAdjustingLocation]);

  // Effect to toggle dragging state
  useEffect(() => {
    if (userMarkerRef.current) {
      if (isAdjustingLocation) {
        userMarkerRef.current.dragging.enable();
      } else {
        userMarkerRef.current.dragging.disable();
      }
    }
  }, [isAdjustingLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    poiMarkersRef.current.forEach((marker) => {
      mapInstanceRef.current.removeLayer(marker);
    });

    poiMarkersRef.current = [];

    pois.forEach((poi) => {
      if (!poi.lat || !poi.lon) return;

      const hospitalIcon = createHospitalIcon(L);

      const marker = L.marker([poi.lat, poi.lon], {
        icon: hospitalIcon,
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

      marker.on("click", () => {
        onPoiClick?.(poi.lat, poi.lon);
      });

      poiMarkersRef.current.push(marker);
    });
  }, [pois, onPoiClick]);

  useEffect(() => {
    if (!mapInstanceRef.current || !userPosition || !destination) {
      if (routingControlRef.current) {
        mapInstanceRef.current?.removeControl(routingControlRef.current);
        routingControlRef.current = null;
        setRouteInfo(null);
      }

      if (destinationMarkerRef.current) {
        mapInstanceRef.current?.removeLayer(destinationMarkerRef.current);
        destinationMarkerRef.current = null;
      }

      return;
    }

    const L = (window as any).L;

    if (!L?.Routing?.control) {
      loadCSS(
        "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css",
      )
        .then(() =>
          loadScript(
            "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js",
          ),
        )
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
      const L = (window as any).L;

      if (!mapInstanceRef.current || !userPosition || !destination) return;

      if (routingControlRef.current) {
        mapInstanceRef.current.removeControl(routingControlRef.current);
        routingControlRef.current = null;
        setRouteInfo(null);
      }

      if (destinationMarkerRef.current) {
        mapInstanceRef.current.removeLayer(destinationMarkerRef.current);
        destinationMarkerRef.current = null;
      }

      const destinationIcon = createDestinationIcon(L);

      destinationMarkerRef.current = L.marker(destination, {
        icon: destinationIcon,
      })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="text-center">
            <div class="font-semibold text-green-600">Destination</div>
            <div class="text-sm text-gray-600">
              ${destination[0].toFixed(4)}, ${destination[1].toFixed(4)}
            </div>
          </div>
        `);

      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(userPosition[0], userPosition[1]),
          L.latLng(destination[0], destination[1]),
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        fitSelectedRoutes: true,
        show: false, // Hide the default ugly routing box
        addWaypoints: false,
        draggableWaypoints: false,
        createMarker: () => null,
        lineOptions: {
          styles: [
            {
              color: "#3b82f6", // tailwind blue-500
              opacity: 0.9,
              weight: 5,
              className: "route-line animate-pulse",
            },
          ],
        },
      })
        .on("routesfound", (e: any) => {
          const routes = e.routes;
          const summary = routes[0].summary;
          // distance is in meters, time is in seconds
          const distanceKm = (summary.totalDistance / 1000).toFixed(1);
          const timeMinutes = Math.round(summary.totalTime / 60);
          setRouteInfo({
            distance: `${distanceKm} km`,
            time: `${timeMinutes} min`,
          });
        })
        .addTo(mapInstanceRef.current);

      const bounds = L.latLngBounds([userPosition, destination]);

      mapInstanceRef.current.flyToBounds(bounds, {
        padding: [70, 70],
        duration: 1.5,
      });
    }
  }, [userPosition?.[0], userPosition?.[1], destination]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const onSearchResultClick = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lon], 16, { animate: true });
    }
    setSearchResults([]);
    setSearchQuery(result.display_name.split(',')[0]); // Set concise name
  };

  const MapStyleSwitcher = () => (
    <div className="absolute left-3 top-44 z-30 rounded-xl bg-white/90 p-1.5 shadow-lg backdrop-blur-sm sm:left-4 sm:p-2">
      <div className="flex flex-col gap-1.5 sm:gap-2">
        {(["light", "dark", "satellite"] as const).map((style) => (
          <button
            key={style}
            onClick={() => setMapStyle(style)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-all sm:h-10 sm:w-10 sm:text-base ${
              mapStyle === style
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title={`Switch to ${style} map`}
            type="button"
          >
            {style === "light" && "🗺️"}
            {style === "dark" && "🌙"}
            {style === "satellite" && "🛰️"}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative h-full w-full font-sans">
      <div
        ref={mapContainerRef}
        className="h-full w-full"
        style={{
          touchAction: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500 sm:h-16 sm:w-16" />
              <p className="font-medium text-gray-600">Loading map...</p>
              <p className="mt-1 text-sm text-gray-500">
                Preparing your navigation experience
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
            <div className="max-w-sm text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Map Loading Failed
              </h3>

              <p className="mb-4 text-gray-600">{error}</p>

              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-blue-500 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-600"
                type="button"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search Bar Overlay - Moved down to clear header */}
      <div className="absolute left-3 right-auto top-28 z-30 w-64 sm:left-4 sm:w-72">
        <form onSubmit={handleSearch} className="relative flex w-full items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location..."
            className="h-11 w-full rounded-2xl border border-gray-200 bg-white/95 pl-10 pr-4 text-sm shadow-xl backdrop-blur-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <div className="absolute left-3 text-gray-400">
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="absolute right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {searchResults.length > 0 && (
          <div className="mt-2 flex max-h-60 w-full flex-col overflow-y-auto rounded-xl bg-white/95 py-2 shadow-2xl backdrop-blur-md">
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSearchResultClick(result)}
                className="flex items-start gap-3 border-b border-gray-100 px-4 py-3 text-left transition hover:bg-blue-50 last:border-0"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <span className="text-sm text-gray-700">{result.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <MapStyleSwitcher />

      <button
        type="button"
        onClick={centerToUser}
        disabled={!userPosition}
        className="absolute bottom-6 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-500 shadow-xl transition active:scale-95 disabled:opacity-50"
        title="Center to my location"
      >
        <Navigation className="h-6 w-6" />
      </button>

      {pois.length === 0 && !isLoading && (
        <div className="absolute left-1/2 top-16 z-30 -translate-x-1/2 sm:top-20">
          <div className="rounded-full bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm sm:px-4">
            <div className="flex items-center gap-2 whitespace-nowrap text-xs text-gray-600 sm:text-sm">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500 sm:h-4 sm:w-4" />
              Searching for nearby hospitals...
            </div>
          </div>
        </div>
      )}

      {/* ETA Route Info Panel */}
      {routeInfo && (
        <div className="absolute bottom-[320px] left-3 right-3 z-30 flex items-center gap-4 rounded-2xl bg-white/95 px-5 py-3 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-5 sm:left-4 sm:right-auto sm:w-80">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Route className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">{routeInfo.time}</span>
              <span className="text-sm font-medium text-gray-500">away</span>
            </div>
            <div className="text-sm font-medium text-gray-600">{routeInfo.distance} • via Fastest Route</div>
          </div>
        </div>
      )}

      {/* Adjust Location Overlay */}
      {isAdjustingLocation ? (
        <div className="absolute bottom-[320px] left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-3 w-full px-4 sm:w-auto">
          <div className="rounded-xl bg-white/90 px-4 py-2 text-sm font-medium text-gray-700 shadow-lg backdrop-blur-sm text-center">
            Drag the blue pin to your exact location
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsAdjustingLocation(false);
                // Snap back to GPS
                if (userPosition && userMarkerRef.current) {
                  userMarkerRef.current.setLatLng(userPosition);
                }
              }}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-gray-600 shadow-xl transition hover:bg-gray-50 active:scale-95"
              type="button"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={() => {
                setIsAdjustingLocation(false);
                if (userMarkerRef.current && onLocationAdjusted) {
                  const newLatLng = userMarkerRef.current.getLatLng();
                  onLocationAdjusted(newLatLng.lat, newLatLng.lng);
                }
              }}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 font-bold text-white shadow-xl transition hover:bg-blue-700 active:scale-95"
              type="button"
            >
              <Check className="h-4 w-4" />
              Confirm Pin
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setIsAdjustingLocation(true);
            // Fly to current pin so user can drag it
            if (userMarkerRef.current && mapInstanceRef.current) {
              mapInstanceRef.current.setView(userMarkerRef.current.getLatLng(), 18, { animate: true });
            }
          }}
          disabled={!userPosition}
          className="absolute bottom-[320px] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition active:scale-95 disabled:opacity-50"
          title="Adjust Pin Location"
          type="button"
        >
          <MapPin className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

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