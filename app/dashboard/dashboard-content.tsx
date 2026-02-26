"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import DashboardSidebar from "@/components/dashboard-sidebar";
import type { User } from "better-auth/types";

const DemandMap = dynamic(() => import("@/components/demand-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] rounded-lg bg-slate-100 animate-pulse flex items-center justify-center">
      <span className="text-slate-400">Loading map...</span>
    </div>
  ),
});

interface DashboardContentProps {
  user: User;
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const router = useRouter();

  const suratHotspots = [
    { id: 1, name: "Surat Railway Station", pincode: "395003", lat: 21.1949, lng: 72.8085, demand: "Very High" as const, change: 92 },
    { id: 2, name: "City Light", pincode: "395007", lat: 21.1865, lng: 72.8232, demand: "High" as const, change: 72 },
    { id: 3, name: "Varachha", pincode: "395006", lat: 21.2092, lng: 72.8554, demand: "High" as const, change: 65 },
    { id: 4, name: "Katargam", pincode: "395004", lat: 21.2254, lng: 72.8023, demand: "Medium" as const, change: 48 },
    { id: 5, name: "Adajan", pincode: "395009", lat: 21.1598, lng: 72.8098, demand: "Medium" as const, change: 45 },
    { id: 6, name: "Udhana", pincode: "394210", lat: 21.1901, lng: 72.8598, demand: "High" as const, change: 68 },
    { id: 7, name: "Pandesara", pincode: "394220", lat: 21.1765, lng: 72.8712, demand: "Low" as const, change: 25 },
    { id: 8, name: "Bhatar", pincode: "395001", lat: 21.1945, lng: 72.7901, demand: "Medium" as const, change: 42 },
  ];

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/signin");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex">
      <DashboardSidebar onSignOut={handleSignOut} />

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Demand Forecast</h2>
                <p className="text-muted-foreground mt-1">Overview of your demand predictions and insights.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                      <span className="text-cyan-600 font-semibold">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total SKUs</p>
                    <p className="text-2xl font-bold">12,450</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  +5.2% this month
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">PIN Codes</p>
                    <p className="text-2xl font-bold">8,234</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  +12% coverage
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Forecast Accuracy</p>
                    <p className="text-2xl font-bold">87.5%</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  +2.3% improvement
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Alerts</p>
                    <p className="text-2xl font-bold">7</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  3 high priority
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Demand Hotspots - Surat</CardTitle>
              <CardDescription>30-day demand forecast by location</CardDescription>
            </CardHeader>
            <CardContent>
              <DemandMap 
                hotspots={suratHotspots} 
                height="350px"
                showLegend={true}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card className="md:col-span-2 border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Demand Forecast - Next 7 Days</CardTitle>
                <CardDescription>Predicted demand by category across all PIN codes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { category: "Beverages", change: "+45%", pincode: "110001 (Delhi)", color: "from-cyan-400 to-blue-400" },
                    { category: "Groceries", change: "+32%", pincode: "400001 (Mumbai)", color: "from-cyan-300 to-blue-300" },
                    { category: "Apparel", change: "+68%", pincode: "600001 (Chennai)", color: "from-cyan-500 to-blue-500" },
                    { category: "Dairy", change: "+18%", pincode: "500001 (Hyderabad)", color: "from-cyan-300 to-blue-300" },
                    { category: "Snacks", change: "+52%", pincode: "700001 (Kolkata)", color: "from-cyan-400 to-blue-400" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground w-32">{item.category}</span>
                      <div className={`flex-1 h-6 bg-gradient-to-r ${item.color} rounded`} />
                      <span className="text-sm font-medium w-16 text-right">{item.change}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  * Forecast for upcoming festive season (Holi)
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Weather Impact</CardTitle>
                <CardDescription>Weather factors affecting demand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-50">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <div>
                        <p className="font-medium">Temperature</p>
                        <p className="text-sm text-muted-foreground">32°C avg</p>
                      </div>
                    </div>
                    <span className="text-cyan-600 font-medium">+15%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                      </svg>
                      <div>
                        <p className="font-medium">Rainfall</p>
                        <p className="text-sm text-muted-foreground">12mm forecast</p>
                      </div>
                    </div>
                    <span className="text-blue-600 font-medium">+8%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-sky-50">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                      </svg>
                      <div>
                        <p className="font-medium">Humidity</p>
                        <p className="text-sm text-muted-foreground">65%</p>
                      </div>
                    </div>
                    <span className="text-sky-600 font-medium">+5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Upcoming Festivals</CardTitle>
                <CardDescription>Events affecting demand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { festival: "Holi", date: "Mar 14, 2026", impact: "High", color: "bg-purple-100 text-purple-700" },
                    { festival: "Ramzan", date: "Mar 1, 2026", impact: "High", color: "bg-green-100 text-green-700" },
                    { festival: "Gudi Padwa", date: "Mar 22, 2026", impact: "Medium", color: "bg-cyan-100 text-cyan-700" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{item.festival}</p>
                        <p className="text-sm text-muted-foreground">{item.date}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.color}`}>
                        {item.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Recent Alerts</CardTitle>
                <CardDescription>Demand anomalies detected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: "Stockout Risk", sku: "SKU-12345", pincode: "110001", severity: "high" },
                    { type: "Demand Spike", sku: "SKU-67890", pincode: "400001", severity: "medium" },
                    { type: "Weather Alert", sku: "All SKUs", pincode: "600001", severity: "low" },
                  ].map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{alert.type}</p>
                        <p className="text-xs text-muted-foreground">{alert.sku} • {alert.pincode}</p>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${
                        alert.severity === "high" ? "bg-red-500" : 
                        alert.severity === "medium" ? "bg-cyan-500" : "bg-blue-500"
                      }`} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                <CardDescription>Common tasks</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button variant="secondary" className="w-full justify-start gap-2 h-11">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Forecast
                </Button>
                <Button variant="secondary" className="w-full justify-start gap-2 h-11">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload Sales Data
                </Button>
                <Button variant="secondary" className="w-full justify-start gap-2 h-11">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Configure Alerts
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
