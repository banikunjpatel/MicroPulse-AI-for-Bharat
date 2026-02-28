"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/setup/PageHeader";
import { ActionRow } from "@/components/setup/ActionRow";
import { EmptyState } from "@/components/setup/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Calendar, Package, MapPin, ChevronLeft, ChevronRight } from "lucide-react";

interface SalesRecord {
  id: number;
  date: string;
  sku_id: string;
  sku_name: string;
  pin_code: string;
  area_name: string;
  units_sold: number;
  unit_price_paise: number | null;
  total_value: number;
}

interface SalesSummary {
  total_records: number;
  date_range: { min: string | null; max: string | null };
  unique_skus: number;
  unique_pins: number;
  total_units: number;
}

export default function SalesHistoryPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    date_from: "",
    date_to: "",
    sku_id: "all",
    pin_code: "all",
  });

  const { data: salesData, isLoading } = useQuery({
    queryKey: ["sales", page, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "50");
      if (filters.date_from) params.set("date_from", filters.date_from);
      if (filters.date_to) params.set("date_to", filters.date_to);
      if (filters.sku_id !== "all") params.set("sku_id", filters.sku_id);
      if (filters.pin_code !== "all") params.set("pin_code", filters.pin_code);

      const res = await fetch(`/api/sales?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data;
    },
  });

  const sales: SalesRecord[] = salesData?.sales ?? [];
  const summary: SalesSummary = salesData?.summary ?? {
    total_records: 0,
    date_range: { min: null, max: null },
    unique_skus: 0,
    unique_pins: 0,
    total_units: 0,
  };
  const totalPages = salesData?.total_pages ?? 0;

  const formatCurrency = (paise: number | null) => {
    if (paise === null) return "—";
    return `₹${(paise / 100).toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Sales History"
          description="View and manage historical sales data"
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Sales History"
        description="View and manage historical sales data"
      />

      <ActionRow>
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push("/setup/sales-history/upload")} className="gap-2">
            <Upload className="h-4 w-4" /> Import Sales Data
          </Button>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {summary.date_range.min && summary.date_range.max
              ? `${formatDate(summary.date_range.min)} - ${formatDate(summary.date_range.max)}`
              : "No data"}
          </span>
          <span className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            {summary.unique_skus} SKUs
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {summary.unique_pins} PINs
          </span>
        </div>
      </ActionRow>

      {/* Filters */}
      <div className="rounded-lg border bg-white p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">From Date</label>
            <Input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="w-40"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">To Date</label>
            <Input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="w-40"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setFilters({ date_from: "", date_to: "", sku_id: "all", pin_code: "all" });
              setPage(1);
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {sales.length === 0 ? (
        <EmptyState
          title="No sales history yet"
          description="Import your first sales data to start building forecasts"
          actionLabel="Import Sales Data"
          onAction={() => router.push("/setup/sales-history/upload")}
        />
      ) : (
        <>
          <div className="rounded-lg border bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50 text-left">
                    <th className="px-4 py-3 text-sm font-medium text-slate-600">Date</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-600">SKU ID</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-600">Product Name</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-600">PIN Code</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-600">Area</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-600 text-right">Units Sold</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-600 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-600 text-right">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((record) => (
                    <tr key={record.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm">{formatDate(record.date)}</td>
                      <td className="px-4 py-3 text-sm font-mono">{record.sku_id}</td>
                      <td className="px-4 py-3 text-sm font-medium">{record.sku_name}</td>
                      <td className="px-4 py-3 text-sm font-mono">{record.pin_code}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{record.area_name}</td>
                      <td className="px-4 py-3 text-sm text-right">{record.units_sold.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(record.unit_price_paise)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {formatCurrency(record.total_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, summary.total_records)} of {summary.total_records.toLocaleString()} records
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Summary Cards */}
      {sales.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4 mt-6">
          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-muted-foreground">Total Records</p>
            <p className="text-2xl font-semibold">{summary.total_records.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-muted-foreground">Total Units Sold</p>
            <p className="text-2xl font-semibold">{summary.total_units.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-muted-foreground">Unique SKUs</p>
            <p className="text-2xl font-semibold">{summary.unique_skus}</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-muted-foreground">Unique PINs</p>
            <p className="text-2xl font-semibold">{summary.unique_pins}</p>
          </div>
        </div>
      )}
    </div>
  );
}
