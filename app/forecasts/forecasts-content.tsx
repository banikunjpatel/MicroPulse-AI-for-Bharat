"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  Package,
  RefreshCw,
  BarChart3,
  Calendar
} from "lucide-react";
import type { User } from "better-auth/types";
import type { ForecastData } from "@/types";

interface ForecastsContentProps {
  user: User;
}

export default function ForecastsContent({ user }: ForecastsContentProps) {
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/forecasts");
      const result = await response.json();
      
      if (result.success) {
        setForecastData(result.data);
      } else {
        setError(result.error?.message || "Failed to fetch forecasts");
      }
    } catch (err) {
      setError("Failed to fetch forecasts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecasts();
  }, []);

  const getTrendIcon = (direction: string) => {
    if (direction === "up" || direction === "increasing") {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (direction === "down" || direction === "decreasing") {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      beverages: "bg-cyan-100 text-cyan-700",
      snacks: "bg-orange-100 text-orange-700",
      dairy: "bg-blue-100 text-blue-700",
      personal_care: "bg-purple-100 text-purple-700",
      household: "bg-emerald-100 text-emerald-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex">
      <DashboardSidebar />

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Demand Forecasts</h2>
                <p className="text-muted-foreground mt-1">
                  AI-powered demand predictions and inventory recommendations
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {forecastData?.period.start} - {forecastData?.period.end}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchForecasts}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-cyan-600" />
                <p className="text-muted-foreground">Generating forecasts...</p>
              </div>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {forecastData && !loading && (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4 mb-8">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Predictions</p>
                        <p className="text-2xl font-bold">{forecastData.summary.total_predictions}</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-cyan-100 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-cyan-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">High Urgency Alerts</p>
                        <p className="text-2xl font-bold text-red-600">{forecastData.summary.high_urgency_alerts}</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Confidence</p>
                        <p className="text-2xl font-bold">{(forecastData.summary.avg_confidence * 100).toFixed(0)}%</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Restock Alerts</p>
                        <p className="text-2xl font-bold">{forecastData.restock_alerts.length}</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Package className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Restock Alerts */}
              {forecastData.restock_alerts.length > 0 && (
                <Card className="border-0 shadow-lg mb-8">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      Restock Alerts
                    </CardTitle>
                    <CardDescription>Items requiring immediate attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {forecastData.restock_alerts.map((alert, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 rounded-lg border"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                              <Package className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium">{alert.sku_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {alert.pin_code} • Stock: {alert.current_stock} / Reorder: {alert.reorder_point}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-medium">+{alert.recommended_units} units</p>
                              <p className="text-sm text-muted-foreground">
                                {alert.days_until_stockout} days until stockout
                              </p>
                            </div>
                            <Badge className={getUrgencyColor(alert.urgency)}>
                              {alert.urgency}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Category Trends */}
              <Card className="border-0 shadow-lg mb-8">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Category Trends</CardTitle>
                  <CardDescription>Predicted changes by product category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-5">
                    {Object.entries(forecastData.trends).map(([category, trend]) => (
                      <div
                        key={category}
                        className="p-4 rounded-lg border bg-slate-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={getCategoryColor(category)}>
                            {category.replace("_", " ")}
                          </Badge>
                          {getTrendIcon(trend.direction)}
                        </div>
                        <p className="text-2xl font-bold">
                          {trend.change_percent > 0 ? "+" : ""}{trend.change_percent}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {trend.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Demand Predictions */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Demand Predictions</CardTitle>
                  <CardDescription>Predicted demand for next {forecastData.period.days} days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">SKU</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Predicted Demand</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Confidence</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {forecastData.predictions.map((prediction, index) => (
                          <tr key={index} className="border-b last:border-0">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{prediction.sku_name}</p>
                                <p className="text-sm text-muted-foreground">{prediction.sku_id}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="text-sm">{prediction.area_name}</p>
                                <p className="text-xs text-muted-foreground">{prediction.pin_code}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <p className="font-medium">{prediction.predicted_demand}</p>
                              <p className="text-xs text-muted-foreground">units</p>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-cyan-500 rounded-full"
                                    style={{ width: `${prediction.confidence * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm">{(prediction.confidence * 100).toFixed(0)}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {getTrendIcon(prediction.trend)}
                                <span className={prediction.change_percent > 0 ? "text-green-600" : prediction.change_percent < 0 ? "text-red-600" : "text-gray-600"}>
                                  {prediction.change_percent > 0 ? "+" : ""}{prediction.change_percent}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Top Growing SKUs */}
              {forecastData.summary.top_growing_skus.length > 0 && (
                <Card className="border-0 shadow-lg mt-8">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold">Top Growing SKUs</CardTitle>
                    <CardDescription>Highest growth potential items</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      {forecastData.summary.top_growing_skus.map((sku, index) => (
                        <div
                          key={index}
                          className="flex-1 p-4 rounded-lg border bg-gradient-to-br from-green-50 to-emerald-50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{sku.sku_id}</p>
                              <p className="text-sm text-muted-foreground">Growth potential</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">+{sku.change}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
