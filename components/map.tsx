"use client";

import { useEffect, useRef, useState } from "react";

// --- Helper Functions to Load Scripts/CSS Dynamically ---

// We will load all dependencies from a CDN to bypass build/bundler issues.

const LEAFLET_JS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

const MARKERCLUSTER_JS_URL = "https://unpkg.com/leaflet.markercluster@1.5.1/dist/leaflet.markercluster.js";
const MARKERCLUSTER_CSS_URL = "https://unpkg.com/leaflet.markercluster@1.5.1/dist/MarkerCluster.css";
const MARKERCLUSTER_DEFAULT_CSS_URL = "https://unpkg.com/leaflet.markercluster@1.5.1/dist/MarkerCluster.Default.css";

const ROUTING_JS_URL = "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js";
const ROUTING_CSS_URL = "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css";

// Function to load a script
const loadScript = (src: string) => {
  return new Promise((resolve, reject) => {
    // Check if script is already present
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

// Function to load a CSS file
const loadCSS = (href: string) => {
  return new Promise((resolve, reject) => {
    // Check if CSS is already present
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve(true);
      return;
    }
    const link = document.createElement("link");
    link.href = href;
    link.rel = "stylesheet";
    link.onload = () => resolve(true);
    link.onerror = reject;
    document.head.appendChild(link);
  });
};


// --- Define Component Props ---
// We use 'any' for Leaflet types since we can't import them directly
// without causing build errors in your environment.

type Poi = {
  lat: number;
  lon: number;
  name: string;
};

type MapComponentProps = {
  center?: any; // LatLngExpression e.g., [number, number]
  zoom?: number;
  userPosition?: any; // LatLngExpression e.g., [number, number]
  pois: Poi[];
  destination: any | null; // LatLngExpression e.g., [number, number]
  onMapInstance?: (map: any) => void; // (map: L.Map) - Made optional
  onPoiClick?: (lat: number, lon: number) => void; // Made optional
};

const MapComponent = ({
  center = [14.5995, 120.9842], // Default center
  zoom = 13, // Default zoom
  userPosition,
  pois = [], // Default to empty array
  destination = null,
  onMapInstance,
  onPoiClick,
}: MapComponentProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // State 0: idle, 1: loading CSS/JS, 2: polling for L, 3: ready, 4: failed
  const [loadState, setLoadState] = useState(0);

  // Use 'any' for Leaflet-specific refs
  const mapInstanceRef = useRef<any | null>(null);
  const userMarkerRef = useRef<any | null>(null);
  const poiClusterLayerRef = useRef<any | null>(null);
  const routingControlRef = useRef<any | null>(null);
  const userIconRef = useRef<any | null>(null); // Ref for user icon
  const hospitalIconRef = useRef<any | null>(null); // Ref for hospital icon

  // --- Prop Refs ---
  const onMapInstanceRef = useRef(onMapInstance);
  const onPoiClickRef = useRef(onPoiClick);

  // Update refs when props change
  useEffect(() => {
    onMapInstanceRef.current = onMapInstance;
    onPoiClickRef.current = onPoiClick;
  }, [onMapInstance, onPoiClick]);

  // --- Effect 1: Load Dependencies (Runs Once) ---
  useEffect(() => {
    // Don't run if already loading or beyond
    if (loadState !== 0) return;

    setLoadState(1); // Set to "loading"
    let isMounted = true; // Flag to track if component is still mounted

    const loadDependencies = async () => {
      try {
        console.log("Loading map dependencies...");
        // Load CSS and main Leaflet script in parallel
        await Promise.all([
          loadCSS(LEAFLET_CSS_URL),
          loadCSS(MARKERCLUSTER_CSS_URL),
          loadCSS(MARKERCLUSTER_DEFAULT_CSS_URL),
          loadCSS(ROUTING_CSS_URL),
          loadScript(LEAFLET_JS_URL)
        ]);
        console.log("Core Leaflet JS/CSS loaded.");

        // Load plugins *after* main Leaflet JS has loaded
        await Promise.all([
          loadScript(MARKERCLUSTER_JS_URL),
          loadScript(ROUTING_JS_URL)
        ]);
        console.log("Leaflet plugins loaded.");

        if (isMounted) {
            setLoadState(2); // Set to "polling for L"
            console.log("Dependencies loaded, starting polling for L object.");
        }
      } catch (error) {
        console.error("Failed to load map dependencies:", error);
        if (isMounted) {
          setLoadState(4); // Set to "failed"
        }
      }
    };

    loadDependencies();

    // Cleanup function
    return () => {
        isMounted = false;
    };
  }, [loadState]); // Only re-run if state is reset to 0

  // --- Effect 2: Poll for L and Initialize Map ---
  useEffect(() => {
    // Only run when in polling state and map container is ready
    if (loadState !== 2 || !mapContainerRef.current || mapInstanceRef.current) {
        return;
    }

    console.log("Polling for L object and plugins...");
    const L = (window as any).L;

    // Check if L and all necessary plugins/methods are ready
    const checkReady = () => {
      const L = (window as any).L;
      return (
        L &&
        typeof L.map === 'function' &&
        typeof L.divIcon === 'function' &&
        typeof L.tileLayer === 'function' &&
        typeof L.markerClusterGroup === 'function' &&
        L.Routing &&
        typeof L.Routing.control === 'function' &&
        typeof L.latLng === 'function' && // Check for latLng too
        typeof L.marker === 'function'    // Check for marker
      );
    };

    if (checkReady()) {
      console.log("Leaflet libraries are fully loaded. Initializing map...");
      setLoadState(3); // Set state to "ready" - triggers map init logic

      // --- Define Custom Icons (now that L is loaded) ---
      userIconRef.current = L.divIcon({ // Store in ref
        html: `<div class="relative flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg">
                 <div class="w-2 h-2 bg-white rounded-full"></div>
               </div>`,
        className: "bg-transparent border-none",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      hospitalIconRef.current = L.divIcon({ // Store in ref
        html: `<div class="flex items-center justify-center w-8 h-8 bg-red-600 rounded-full border-2 border-white shadow-md">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-8-4.5-8-11.5A8 8 0 0 1 12 2.5a8 8 0 0 1 8 8.5c0 7-8 11.5-8 11.5z"/><path d="m9 10 6 6m-6 0 6-6"/></svg>
               </div>`,
        className: "bg-transparent border-none",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // --- Initialize Map ---
      let map: any; // Declare map variable
      try {
        // Prevent re-initialization check
        if (!mapInstanceRef.current && mapContainerRef.current) {
             console.log("Creating map instance...");
             map = L.map(mapContainerRef.current, { // Initialize inside try block
                 zoomControl: false,
             }).setView(center, zoom); // Set initial view here

             L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
                 attribution:
                     '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
             }).addTo(map);

             // Initialize the cluster group layer and add it to the map
             poiClusterLayerRef.current = L.markerClusterGroup();
             map.addLayer(poiClusterLayerRef.current);

             mapInstanceRef.current = map;
             console.log("Map instance created:", mapInstanceRef.current);
             if (onMapInstanceRef.current) {
                 onMapInstanceRef.current(map); // Pass instance to parent
             }
        } else if (mapInstanceRef.current) {
            console.log("Map instance already exists.");
        } else {
            console.error("Map container ref is not available.");
            setLoadState(4); // Failed state
        }

      } catch (e) {
          console.error("Error initializing Leaflet map:", e);
          setLoadState(4); // Failed state
          return; // Stop execution if map init fails
      }

    } else {
      // If not ready, poll again shortly
      const pollTimeout = setTimeout(() => {
        // Trigger re-check by setting state (though state value is same)
        setLoadState(2);
      }, 100); // Poll every 100ms

      // Cleanup timeout on unmount or if state changes
      return () => clearTimeout(pollTimeout);
    }

    // Map Initialization Cleanup
    return () => {
      // Only runs if map was successfully initialized in *this* effect run
      if (mapInstanceRef.current && loadState === 3) {
        console.log("Cleaning up map instance (Effect 2 Cleanup)...");
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        // Reset refs
        userMarkerRef.current = null;
        poiClusterLayerRef.current = null;
        routingControlRef.current = null;
        // Don't reset loadState here, effect 1 handles that logic
      }
    };
  }, [loadState, center, zoom]); // Depend on loadState, center, zoom

  // --- Effect 3: Set Map View (Updates existing map) ---
  useEffect(() => {
    // Only run if map is fully ready (state 3)
    if (loadState !== 3 || !mapInstanceRef.current) {
      return;
    }
    // Set view based on props
    console.log("Setting map view (Effect 3):", center, zoom);
    mapInstanceRef.current.setView(center, zoom);

  }, [loadState, center, zoom]); // Runs when map is ready or view props change


  // --- Effect 4: Update User Position ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = (window as any).L;

    // Only run if map is ready (state 3) AND we have a position AND L is ready
    if (loadState !== 3 || !map || !L || !userPosition) {
        // Clear marker if userPosition becomes null/undefined
        if (userMarkerRef.current && !userPosition) {
            console.log("Removing user marker.");
            map.removeLayer(userMarkerRef.current);
            userMarkerRef.current = null;
        }
        return;
    }

    const icon = userIconRef.current; // Use icon from ref
    if (!icon) {
        console.warn("User icon ref not ready yet (Effect 4).");
        return;
    }

    if (!userMarkerRef.current) {
      // Create marker if it doesn't exist
      console.log("Creating user marker (Effect 4) at:", userPosition);
      userMarkerRef.current = L.marker(userPosition, { icon: icon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup("You are here");
    } else {
      // Just update position if it does
      console.log("Updating user marker position (Effect 4) to:", userPosition);
      userMarkerRef.current.setLatLng(userPosition);
    }
  }, [userPosition, loadState]); // Runs when userPosition or map load state changes

  // --- Effect 5: Update POI Markers ---
  useEffect(() => {
    const poiLayer = poiClusterLayerRef.current;
    const L = (window as any).L;

    // Only run if map & layer are ready (state 3) AND L is ready
    if (loadState !== 3 || !poiLayer || !L) return;

    const icon = hospitalIconRef.current; // Use icon from ref
    if (!icon) {
        console.warn("Hospital icon ref not ready yet (Effect 5).");
        return;
    }
     // Ensure markerClusterGroup is still available
    if (typeof L.markerClusterGroup !== 'function') {
      console.error("markerClusterGroup is not available on L (Effect 5).");
      return;
    }


    console.log("Updating POI markers (Effect 5):", pois.length);
    // Clear existing hospital markers
    poiLayer.clearLayers();

    // Add new markers only if pois array has items
    if (pois && pois.length > 0) {
        const markers = pois.map((poi: Poi) => {
          const marker = L.marker([poi.lat, poi.lon], { icon: icon });
          marker.bindPopup(`<b>${poi.name}</b><br>Click to get directions.`);
          // Add click event to set destination, if prop exists
          if (onPoiClickRef.current) {
            marker.on('click', () => {
              if(onPoiClickRef.current) { // Double check ref
                console.log("POI clicked:", poi.name, poi.lat, poi.lon);
                onPoiClickRef.current(poi.lat, poi.lon);
              }
            });
          }
          return marker;
        });
        poiLayer.addLayers(markers);
    } else {
        console.log("No POIs to display.");
    }
  }, [pois, loadState]); // Runs when POIs or map load state changes

  // --- Effect 6: Update Routing ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = (window as any).L;

    // Only run if map is ready (state 3) AND L is ready
    if (loadState !== 3 || !map || !L) return;

    // Check if Routing plugin is loaded and available first
    if (!L.Routing || typeof L.Routing.control !== 'function') {
        if (userPosition && destination) {
            console.warn("Routing plugin (L.Routing or L.Routing.control) is not loaded or available (Effect 6). Cannot display route.");
        }
         // Ensure existing route is removed if plugin disappears (unlikely but safe)
        if (routingControlRef.current) {
            console.log("Routing plugin disappeared, removing existing control.");
            map.removeControl(routingControlRef.current);
            routingControlRef.current = null;
        }
        return; // Exit if routing is not ready
    }

    // Now, manage the route based on userPosition and destination
    // Remove existing route if destination is null or userPosition is null
    if (routingControlRef.current && (!userPosition || !destination)) {
      console.log("Removing existing route control (Effect 6 - destination/user removed).");
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Create a new route only if we have a user and a destination, AND no route exists yet
    if (userPosition && destination && !routingControlRef.current) {
      console.log("Creating new route (Effect 6) from:", userPosition, "to:", destination);
      try {
          // Validate lat/lng - ensure they are numbers
          const startLatLng = L.latLng(userPosition);
          const endLatLng = L.latLng(destination);

          routingControlRef.current = L.Routing.control({ // Use L directly
            waypoints: [startLatLng, endLatLng],
            routeWhileDragging: false,
            show: false, // Hide text-based directions
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            lineOptions: {
              styles: [{ color: "#007BFF", opacity: 0.8, weight: 6 }],
            },
            // Use a default OSRM router or configure one
            router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1' // Public OSRM server
            }),
             createMarker: function() { return null; } // Don't show start/end markers from routing control
          }).addTo(map);

          // Optional: Add event listener for routing errors
          routingControlRef.current.on('routingerror', function(e: any) {
              console.error('Routing Error:', e.error);
              // Maybe show a user-friendly message
              // Clean up the failed control
              if (routingControlRef.current) {
                 map.removeControl(routingControlRef.current);
                 routingControlRef.current = null;
              }
          });
           routingControlRef.current.on('routesfound', function(e: any) {
              console.log('Route found:', e.routes[0]);
           });


      } catch (error) {
           console.error("Error creating routing control:", error);
           // Handle potential errors during control creation
           if (routingControlRef.current) { // Clean up partial creation if error occurred
              map.removeControl(routingControlRef.current);
              routingControlRef.current = null;
           }
      }
    } else if (userPosition && destination && routingControlRef.current) {
        // If route exists, update waypoints (optional, useful if user moves during routing)
        // console.log("Updating route waypoints (Effect 6)");
        // routingControlRef.current.setWaypoints([ L.latLng(userPosition), L.latLng(destination) ]);
    }
     else {
        // This case handles when userPosition or destination is null, and route *was* already removed.
       // console.log("No user position or destination, skipping route creation (Effect 6).");
    }
  }, [userPosition, destination, loadState]); // Runs when user/destination or map load state changes

  // Display loading/error states or the map container
  return (
    <div
      ref={mapContainerRef}
      style={{ height: "100%", width: "100%", backgroundColor: '#e2e8f0' /* Light gray background */ }}
    >
      {loadState === 1 && <div className="p-4 text-center text-gray-600">Loading map libraries...</div>}
      {loadState === 4 && <div className="p-4 text-center text-red-600">Failed to load map libraries. Please refresh.</div>}
      {/* Map is initialized inside the div when loadState is 3 */}
    </div>
  );
};

export default MapComponent;
