"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const DemandMap = dynamic(() => import("@/components/demand-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-xl bg-slate-100 animate-pulse flex items-center justify-center">
      <span className="text-slate-400">Loading map...</span>
    </div>
  ),
});

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

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              MicroPulse
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden py-24 md:py-32">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-100 via-background to-background dark:from-cyan-900/20" />
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-muted-foreground mb-6">
              <span className="flex h-2 w-2 rounded-full bg-cyan-500 mr-2 animate-pulse"></span>
              AI-Powered Demand Forecasting
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Predict demand at every{" "}
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                PIN code
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              MicroPulse uses AI to forecast SKU-level demand with PIN-code granularity for Indian retail. 
              Integrate weather, festivals, and historical data to optimize inventory and reduce waste.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 px-8">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/signin">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Live Demand Map - Surat</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Real-time demand forecasting hotspots across PIN codes. Click on markers to see detailed forecasts.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <DemandMap 
                hotspots={suratHotspots} 
                height="550px"
                showLegend={true}
              />
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-gradient-to-b from-cyan-50 to-background dark:from-cyan-950/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Powerful forecasting features</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Everything you need to predict demand accurately and optimize your inventory.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group relative rounded-xl border bg-background p-6 shadow-sm transition-all hover:shadow-md hover:border-cyan-200">
                <div className="h-12 w-12 rounded-lg bg-cyan-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">PIN-Code Granularity</h3>
                <p className="text-muted-foreground">
                  Get demand forecasts at individual PIN code level across India. Understand regional preferences and local patterns.
                </p>
              </div>
              <div className="group relative rounded-xl border bg-background p-6 shadow-sm transition-all hover:shadow-md hover:border-cyan-200">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Weather Integration</h3>
                <p className="text-muted-foreground">
                  Integrate real-time weather data including temperature, rainfall, and humidity to predict weather-sensitive demand.
                </p>
              </div>
              <div className="group relative rounded-xl border bg-background p-6 shadow-sm transition-all hover:shadow-md hover:border-cyan-200">
                <div className="h-12 w-12 rounded-lg bg-cyan-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Festival Calendar</h3>
                <p className="text-muted-foreground">
                  Account for national and regional festivals that create predictable demand spikes across different product categories.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-4">
                  SKU-Level Demand Forecasting
                </h2>
                <p className="text-muted-foreground mb-6">
                  Predict demand for individual stock keeping units across your entire product catalog. Our AI analyzes historical sales patterns, weather correlations, and festival impacts to deliver accurate forecasts.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-cyan-100 flex items-center justify-center">
                      <svg className="h-4 w-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>85%+ forecast accuracy</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-cyan-100 flex items-center justify-center">
                      <svg className="h-4 w-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>7, 14, and 30-day forecast horizons</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-cyan-100 flex items-center justify-center">
                      <svg className="h-4 w-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Reduce stockouts by 40%</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-cyan-100 flex items-center justify-center">
                      <svg className="h-4 w-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Cut inventory costs by 20-30%</span>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="rounded-xl border bg-white shadow-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Demand Forecast</h3>
                    <span className="text-sm text-muted-foreground">Next 30 days</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground w-16">PIN: 395003</span>
                      <div className="flex-1 h-8 bg-gradient-to-r from-cyan-400 to-blue-400 rounded" />
                      <span className="text-sm font-medium">+92%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground w-16">PIN: 395007</span>
                      <div className="flex-1 h-8 bg-gradient-to-r from-cyan-300 to-blue-300 rounded" />
                      <span className="text-sm font-medium">+72%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground w-16">PIN: 395006</span>
                      <div className="flex-1 h-8 bg-gradient-to-r from-cyan-300 to-blue-300 rounded" />
                      <span className="text-sm font-medium">+65%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground w-16">PIN: 395004</span>
                      <div className="flex-1 h-8 bg-gradient-to-r from-cyan-200 to-blue-200 rounded" />
                      <span className="text-sm font-medium">+48%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Forecast for Surat city (Festive Season)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Built for Indian Retail</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Designed specifically for the unique challenges of Indian retail operations.
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center p-6 rounded-lg">
                <div className="text-3xl font-bold text-cyan-600 mb-2">20,000+</div>
                <p className="text-sm text-muted-foreground">PIN Codes Covered</p>
              </div>
              <div className="text-center p-6 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
                <p className="text-sm text-muted-foreground">Festival Calendars</p>
              </div>
              <div className="text-center p-6 rounded-lg">
                <div className="text-3xl font-bold text-cyan-600 mb-2">85%+</div>
                <p className="text-sm text-muted-foreground">Forecast Accuracy</p>
              </div>
              <div className="text-center p-6 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
                <p className="text-sm text-muted-foreground">AI Processing</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-gradient-to-b from-cyan-50 to-background dark:from-cyan-950/20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Ready to optimize your inventory?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Join Indian retailers who are already using MicroPulse to predict demand and reduce waste.
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 px-8">
                Start Your Free Trial
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2026 MicroPulse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
