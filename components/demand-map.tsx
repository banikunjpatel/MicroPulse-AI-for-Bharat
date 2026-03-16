"use client";

import { useEffect, useState } from "react";
import type { PinMapPoint } from "@/app/api/dashboard/map-data/route";

interface DemandMapProps {
  points: PinMapPoint[];
  height?: string;
  showLegend?: boolean;
}

const trendColors: Record<string, string> = {
  increasing: "#ef4444",
  stable:     "#06b6d4",
  decreasing: "#3b82f6",
};

const priorityColors: Record<string, string> = {
  critical: "#dc2626",
  high:     "#ea580c",
  medium:   "#ca8a04",
  low:      "#16a34a",
};

function demandLevel(total: number): string {
  if (total >= 500) return "Very High";
  if (total >= 200) return "High";
  if (total >= 80)  return "Medium";
  return "Low";
}

export default function DemandMap({ points, height = "500px", showLegend = true }: DemandMapProps) {
  const [MapComponents, setMapComponents] = useState<{
    MapContainer: typeof import("react-leaflet").MapContainer;
    TileLayer:    typeof import("react-leaflet").TileLayer;
    CircleMarker: typeof import("react-leaflet").CircleMarker;
    Popup:        typeof import("react-leaflet").Popup;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    import("react-leaflet").then((rl) => {
      setMapComponents({
        MapContainer: rl.MapContainer,
        TileLayer:    rl.TileLayer,
        CircleMarker: rl.CircleMarker,
        Popup:        rl.Popup,
      });
    });
  }, []);

  if (!mounted || !MapComponents) {
    return (
      <div className="rounded-xl bg-slate-100 animate-pulse flex items-center justify-center" style={{ height }}>
        <span className="text-slate-400">Loading map...</span>
      </div>
    );
  }

  // Compute map center from points, fallback to India center
  const center: [number, number] = points.length
    ? [
        points.reduce((s, p) => s + p.lat, 0) / points.length,
        points.reduce((s, p) => s + p.lng, 0) / points.length,
      ]
    : [20.5937, 78.9629];

  const zoom = points.length === 1 ? 12 : points.length <= 5 ? 10 : 5;

  const { MapContainer, TileLayer, CircleMarker, Popup } = MapComponents;

  return (
    <div className="relative rounded-xl overflow-hidden shadow-2xl" style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {points.map((pt) => {
          const color = trendColors[pt.trend] ?? "#06b6d4";
          const radius = Math.max(8, Math.min(22, 8 + pt.total_predicted_demand / 80));
          return (
            <CircleMarker
              key={pt.pincode}
              center={[pt.lat, pt.lng]}
              radius={radius}
              pathOptions={{ fillColor: color, fillOpacity: 0.75, color, weight: 2 }}
            >
              <Popup maxWidth={340} minWidth={280}>
                <div style={{ fontFamily: "sans-serif", fontSize: 13 }}>
                  {/* Header */}
                  <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 6, marginBottom: 8 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{pt.area_name}</p>
                    <p style={{ color: "#6b7280", margin: "2px 0 0" }}>PIN: {pt.pincode}</p>
                  </div>

                  {/* Forecast summary */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                    <div style={{ background: "#f0f9ff", borderRadius: 6, padding: "6px 8px" }}>
                      <p style={{ color: "#6b7280", margin: 0, fontSize: 11 }}>Predicted Demand</p>
                      <p style={{ fontWeight: 700, margin: 0, color: "#0e7490" }}>{pt.total_predicted_demand.toLocaleString()} units</p>
                    </div>
                    <div style={{ background: "#f0fdf4", borderRadius: 6, padding: "6px 8px" }}>
                      <p style={{ color: "#6b7280", margin: 0, fontSize: 11 }}>Avg Confidence</p>
                      <p style={{ fontWeight: 700, margin: 0, color: "#15803d" }}>{Math.round(pt.avg_confidence * 100)}%</p>
                    </div>
                    <div style={{ background: "#fef9c3", borderRadius: 6, padding: "6px 8px" }}>
                      <p style={{ color: "#6b7280", margin: 0, fontSize: 11 }}>Demand Level</p>
                      <p style={{ fontWeight: 700, margin: 0, color: "#854d0e" }}>{demandLevel(pt.total_predicted_demand)}</p>
                    </div>
                    <div style={{ background: "#fdf2f8", borderRadius: 6, padding: "6px 8px" }}>
                      <p style={{ color: "#6b7280", margin: 0, fontSize: 11 }}>Trend</p>
                      <p style={{ fontWeight: 700, margin: 0, color: trendColors[pt.trend] }}>
                        {pt.trend.charAt(0).toUpperCase() + pt.trend.slice(1)}
                        {pt.max_change_percent !== 0 && ` (${pt.max_change_percent > 0 ? "+" : ""}${pt.max_change_percent.toFixed(1)}%)`}
                      </p>
                    </div>
                  </div>

                  {/* Top SKU predictions */}
                  {pt.predictions.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: 12, color: "#374151" }}>Top SKUs</p>
                      {pt.predictions.slice(0, 3).map((pred, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #f3f4f6" }}>
                          <span style={{ color: "#374151", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pred.sku_name}</span>
                          <span style={{ fontWeight: 600, color: trendColors[pred.trend] }}>{pred.predicted_demand} u</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Restock alerts */}
                  {pt.restock_alerts.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: 12, color: "#374151" }}>
                        ⚠️ Restock Alerts ({pt.restock_alerts.length})
                      </p>
                      {pt.restock_alerts.slice(0, 2).map((a, i) => (
                        <div key={i} style={{ background: a.urgency === "high" ? "#fef2f2" : "#fff7ed", borderRadius: 4, padding: "4px 6px", marginBottom: 3 }}>
                          <span style={{ fontWeight: 600, color: a.urgency === "high" ? "#dc2626" : "#ea580c" }}>
                            [{a.urgency.toUpperCase()}]
                          </span>{" "}
                          <span style={{ color: "#374151" }}>{a.sku_name}</span>
                          <span style={{ color: "#6b7280", fontSize: 11 }}> — {a.current_stock} left, reorder at {a.reorder_point}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Immediate actions */}
                  {pt.immediate_actions.length > 0 && (
                    <div>
                      <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: 12, color: "#374151" }}>
                        🎯 Actions Required
                      </p>
                      {pt.immediate_actions.slice(0, 3).map((action, i) => (
                        <div key={i} style={{ borderLeft: `3px solid ${priorityColors[action.priority] ?? "#6b7280"}`, paddingLeft: 6, marginBottom: 5 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 3,
                              background: priorityColors[action.priority] ?? "#6b7280", color: "#fff",
                            }}>
                              {action.priority.toUpperCase()}
                            </span>
                            <span style={{ fontWeight: 600, color: "#111827" }}>{action.title}</span>
                          </div>
                          <p style={{ color: "#6b7280", margin: "2px 0 0", fontSize: 11 }}>{action.description}</p>
                          {action.deadline && (
                            <p style={{ color: "#9ca3af", margin: "1px 0 0", fontSize: 10 }}>⏰ {action.deadline}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {showLegend && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg">
          <p className="text-xs font-semibold text-gray-600 mb-2">Trend</p>
          <div className="space-y-1">
            {Object.entries(trendColors).map(([trend, color]) => (
              <div key={trend} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-gray-600 capitalize">{trend}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
