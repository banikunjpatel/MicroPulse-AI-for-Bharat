"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import DashboardSidebar from "@/components/dashboard-sidebar";
import type { User } from "better-auth/types";
import type { PinMapPoint } from "@/app/api/dashboard/map-data/route";
import type { RestockAlert, ImmediateAction } from "@/types";

const DemandMap = dynamic(() => import("@/components/demand-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[700px] rounded-lg bg-slate-100 animate-pulse flex items-center justify-center">
      <span className="text-slate-400">Loading map...</span>
    </div>
  ),
});

interface DashboardContentProps {
  user: User;
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const router = useRouter();
  const [mapPoints, setMapPoints] = useState<PinMapPoint[]>([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [alertsData, setAlertsData] = useState<{ restock_alerts: RestockAlert[]; immediate_actions: ImmediateAction[] }>({ restock_alerts: [], immediate_actions: [] });
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [activeAlertTab, setActiveAlertTab] = useState<"restock" | "actions">("restock");

  useEffect(() => {
    fetch("/api/dashboard/map-data")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setMapPoints(res.data);
          setGeneratedAt(res.generated_at);
        } else {
          setMapError(res.error?.message ?? "Failed to load map data");
        }
      })
      .catch(() => setMapError("Failed to load map data"))
      .finally(() => setMapLoading(false));

    fetch("/api/dashboard/alerts")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setAlertsData(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setAlertsLoading(false));
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/signin");
    router.refresh();
  };

  // Derive summary stats from map points
  const totalPredictedDemand = mapPoints.reduce((s, p) => s + p.total_predicted_demand, 0);
  const totalRestockAlerts = mapPoints.reduce((s, p) => s + p.restock_alerts.length, 0);
  const highUrgencyAlerts = mapPoints.reduce(
    (s, p) => s + p.restock_alerts.filter((a) => a.urgency === "high").length,
  0);
  const avgConfidence = mapPoints.length
    ? Math.round((mapPoints.reduce((s, p) => s + p.avg_confidence, 0) / mapPoints.length) * 100)
    : null;

  // Combined alerts count (restock + immediate actions)
  const totalAlerts = alertsData.restock_alerts.length + alertsData.immediate_actions.length;

  // Top actions across all pins, sorted by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const allActions = mapPoints
    .flatMap((p) => p.immediate_actions.map((a) => ({ ...a, area_name: p.area_name, pincode: p.pincode })))
    .sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex">
      <DashboardSidebar onSignOut={handleSignOut} />

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Demand Forecast</h2>
              <p className="text-muted-foreground mt-1">
                {generatedAt
                  ? `Last forecast: ${new Date(generatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`
                  : "Overview of your demand predictions and insights."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {user.image ? (
                <Image src={user.image} alt={user.name ?? ""} width={40} height={40} className="rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                  <span className="text-cyan-600 font-semibold">{user.name?.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Predicted Demand</p>
                    <p className="text-2xl font-bold">
                      {mapLoading ? "—" : totalPredictedDemand.toLocaleString()}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Total units across all PINs</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">PIN Codes</p>
                    <p className="text-2xl font-bold">{mapLoading ? "—" : mapPoints.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Locations with forecast data</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Forecast Confidence</p>
                    <p className="text-2xl font-bold">{mapLoading ? "—" : avgConfidence !== null ? `${avgConfidence}%` : "—"}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Average across all predictions</p>
              </CardContent>
            </Card>

            <Card 
              className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all hover:border-red-200"
              onClick={() => setShowAlertsModal(true)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Alerts</p>
                    <p className="text-2xl font-bold">{alertsLoading ? "—" : totalAlerts}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-red-500 mt-2">{alertsLoading ? "" : `${alertsData.restock_alerts.length} restock • ${alertsData.immediate_actions.length} actions`}</p>
              </CardContent>
            </Card>
          </div>

          {/* Map */}
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Demand Forecast Map</CardTitle>
              <CardDescription>Click a pin to see predictions, restock alerts, and actions</CardDescription>
            </CardHeader>
            <CardContent>
              {mapError ? (
                <div className="h-[700px] flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <p>{mapError}</p>
                  <Link href="/forecasts">
                    <Button variant="secondary" size="sm">Generate a Forecast</Button>
                  </Link>
                </div>
              ) : (
                <DemandMap points={mapPoints} height="700px" showLegend={true} />
              )}
            </CardContent>
          </Card>

          {/* Actions + Quick actions */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {/* Immediate actions from forecast */}
            <Card className="md:col-span-2 border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Actions Required</CardTitle>
                <CardDescription>Prioritised actions from the latest forecast</CardDescription>
              </CardHeader>
              <CardContent>
                {mapLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />
                    ))}
                  </div>
                ) : allActions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No actions found. Generate a forecast to see recommendations.</p>
                ) : (
                  <div className="space-y-3">
                    {allActions.map((action, i) => {
                      const borderColor =
                        action.priority === "critical" ? "border-red-500" :
                        action.priority === "high"     ? "border-orange-500" :
                        action.priority === "medium"   ? "border-yellow-500" : "border-green-500";
                      const badgeBg =
                        action.priority === "critical" ? "bg-red-100 text-red-700" :
                        action.priority === "high"     ? "bg-orange-100 text-orange-700" :
                        action.priority === "medium"   ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700";
                      return (
                        <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border-l-4 bg-slate-50 ${borderColor}`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeBg}`}>
                                {action.priority.toUpperCase()}
                              </span>
                              <span className="text-sm font-medium text-gray-900">{action.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="text-xs text-gray-400">{action.area_name} ({action.pincode})</span>
                              {action.deadline && (
                                <span className="text-xs text-orange-500">⏰ {action.deadline}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                <CardDescription>Common tasks</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Link href="/forecasts">
                  <Button variant="secondary" className="w-full justify-start gap-2 h-11">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    New Forecast
                  </Button>
                </Link>
                <Link href="/setup/sales-history">
                  <Button variant="secondary" className="w-full justify-start gap-2 h-11">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload Sales Data
                  </Button>
                </Link>
                <Link href="/setup/inventory">
                  <Button variant="secondary" className="w-full justify-start gap-2 h-11">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Manage Inventory
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Alerts Modal */}
          <Dialog open={showAlertsModal} onOpenChange={setShowAlertsModal}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-xl">Alerts</DialogTitle>
              </DialogHeader>
              
              {/* Tabs */}
              <div className="flex border-b mb-4">
                <button
                  onClick={() => setActiveAlertTab("restock")}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    activeAlertTab === "restock" 
                      ? "border-red-500 text-red-600" 
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Restock Alerts ({alertsData.restock_alerts.length})
                </button>
                <button
                  onClick={() => setActiveAlertTab("actions")}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    activeAlertTab === "actions" 
                      ? "border-orange-500 text-orange-600" 
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Actions Required ({alertsData.immediate_actions.length})
                </button>
              </div>

              {/* Alert List */}
              <div className="overflow-y-auto flex-1 min-h-0">
                {activeAlertTab === "restock" ? (
                  alertsData.restock_alerts.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">No restock alerts</p>
                  ) : (
                    <div className="space-y-3">
                      {alertsData.restock_alerts.map((alert, i) => {
                        const urgencyColor = {
                          high: "bg-red-100 text-red-700 border-red-200",
                          medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
                          low: "bg-green-100 text-green-700 border-green-200",
                        }[alert.urgency] || "bg-gray-100 text-gray-700";
                        
                        return (
                          <div key={i} className="p-4 rounded-lg border bg-card">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${urgencyColor}`}>
                                    {alert.urgency.toUpperCase()}
                                  </span>
                                  <span className="font-medium">{alert.sku_name}</span>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                  <div className="bg-slate-50 rounded p-2">
                                    <p className="text-xs text-muted-foreground">Current Stock</p>
                                    <p className="font-semibold">{alert.current_stock}</p>
                                  </div>
                                  <div className="bg-slate-50 rounded p-2">
                                    <p className="text-xs text-muted-foreground">Reorder Point</p>
                                    <p className="font-semibold">{alert.reorder_point}</p>
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>PIN: {alert.pin_code}</span>
                                  <span>{alert.days_until_stockout} days until stockout</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  alertsData.immediate_actions.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">No actions required</p>
                  ) : (
                    <div className="space-y-3">
                      {alertsData.immediate_actions.map((action, i) => {
                        const priorityColor = {
                          critical: "border-red-500 bg-red-50",
                          high: "border-orange-500 bg-orange-50",
                          medium: "border-yellow-500 bg-yellow-50",
                          low: "border-green-500 bg-green-50",
                        }[action.priority] || "border-gray-300 bg-gray-50";
                        
                        const badgeBg = {
                          critical: "bg-red-100 text-red-700",
                          high: "bg-orange-100 text-orange-700",
                          medium: "bg-yellow-100 text-yellow-700",
                          low: "bg-green-100 text-green-700",
                        }[action.priority] || "bg-gray-100 text-gray-700";
                        
                        return (
                          <div key={i} className={`p-4 rounded-lg border-l-4 ${priorityColor}`}>
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeBg}`}>
                                    {action.priority.toUpperCase()}
                                  </span>
                                  <span className="font-medium">{action.title}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">{action.description}</p>
                                {action.deadline && (
                                  <p className="text-xs text-orange-600 mt-2">⏰ {action.deadline}</p>
                                )}
                                {action.pin_codes && action.pin_codes.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1">PIN: {action.pin_codes.join(", ")}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
