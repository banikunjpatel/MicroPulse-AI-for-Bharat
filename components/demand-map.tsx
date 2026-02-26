"use client";

import { useEffect, useState } from "react";

interface DemandHotspot {
  id: number;
  name: string;
  pincode: string;
  lat: number;
  lng: number;
  demand: "Very High" | "High" | "Medium" | "Low";
  change: number;
}

interface DemandMapProps {
  hotspots: DemandHotspot[];
  height?: string;
  showLegend?: boolean;
}

const demandColors = {
  "Very High": "#ef4444",
  "High": "#f97316",
  "Medium": "#06b6d4",
  "Low": "#3b82f6",
};

export default function DemandMap({ hotspots, height = "500px", showLegend = true }: DemandMapProps) {
  const [MapComponents, setMapComponents] = useState<{
    MapContainer: typeof import("react-leaflet").MapContainer;
    TileLayer: typeof import("react-leaflet").TileLayer;
    CircleMarker: typeof import("react-leaflet").CircleMarker;
    Popup: typeof import("react-leaflet").Popup;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    Promise.all([
      import("react-leaflet"),
    ]).then(([reactLeaflet]) => {
      setMapComponents({
        MapContainer: reactLeaflet.MapContainer,
        TileLayer: reactLeaflet.TileLayer,
        CircleMarker: reactLeaflet.CircleMarker,
        Popup: reactLeaflet.Popup,
      });
    });
  }, []);

  if (!mounted || !MapComponents) {
    return (
      <div 
        className="rounded-xl bg-slate-100 animate-pulse flex items-center justify-center"
        style={{ height }}
      >
        <span className="text-slate-400">Loading map...</span>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Popup } = MapComponents;

  return (
    <div className="relative rounded-xl overflow-hidden shadow-2xl" style={{ height }}>
      <MapContainer
        center={[21.1702, 72.8311]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {hotspots.map((spot) => (
          <CircleMarker
            key={spot.id}
            center={[spot.lat, spot.lng]}
            radius={12}
            pathOptions={{
              fillColor: demandColors[spot.demand],
              fillOpacity: 0.7,
              color: demandColors[spot.demand],
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-center p-1">
                <p className="font-semibold">{spot.name}</p>
                <p className="text-sm text-gray-500">PIN: {spot.pincode}</p>
                <p className="text-lg font-bold mt-1" style={{ color: demandColors[spot.demand] }}>
                  {spot.change > 0 ? "+" : ""}{spot.change}%
                </p>
                <p className="text-xs text-gray-400">30-day forecast</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      
      {showLegend && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg">
          <p className="text-xs font-semibold text-gray-600 mb-2">Demand Level</p>
          <div className="space-y-1">
            {Object.entries(demandColors).map(([level, color]) => (
              <div key={level} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-gray-600">{level}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-gray-500">Surat, Gujarat</p>
        <p className="text-xs text-gray-400">30-day forecast</p>
      </div>
    </div>
  );
}
