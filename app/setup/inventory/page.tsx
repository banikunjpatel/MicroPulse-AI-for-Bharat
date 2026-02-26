"use client";

import { useState, useMemo } from "react";
import { InventoryRecord, InventoryStatus, SKU_CATEGORIES } from "@/types";
import { mockInventory, mockPINCodes } from "@/lib/mock-data";
import { PageHeader } from "@/components/setup/PageHeader";
import { ActionRow } from "@/components/setup/ActionRow";
import { EmptyState } from "@/components/setup/EmptyState";
import { StatusBadge } from "@/components/setup/StatusBadge";
import { CategoryTag } from "@/components/setup/CategoryTag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Save, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const getInventoryStatus = (record: InventoryRecord): InventoryStatus => {
  const ratio = record.stock_on_hand / record.reorder_point;
  if (ratio >= 1.5) return "healthy";
  if (ratio >= 0.8) return "low";
  return "critical";
};

export default function InventoryPage() {
  const [filters, setFilters] = useState({ pin_code: "all", category: "all" });
  const [localInventory, setLocalInventory] = useState<InventoryRecord[]>(mockInventory);
  const [dirtyRows, setDirtyRows] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);

  const filteredInventory = useMemo(() => {
    let filtered = [...localInventory];
    if (filters.pin_code !== "all") {
      filtered = filtered.filter((r) => r.pin_code === filters.pin_code);
    }
    if (filters.category !== "all") {
      filtered = filtered.filter((r) => r.category === filters.category);
    }
    return filtered;
  }, [localInventory, filters]);

  const handleResetFilters = () => {
    setFilters({ pin_code: "all", category: "all" });
    setLocalInventory(mockInventory);
    setDirtyRows(new Set());
    setIsDirty(false);
  };

  const handleApplyFilters = () => {
    const filtered = [...mockInventory];
    const finalFiltered = filtered.filter((r) => {
      if (filters.pin_code !== "all" && r.pin_code !== filters.pin_code) return false;
      if (filters.category !== "all" && r.category !== filters.category) return false;
      return true;
    });
    setLocalInventory(finalFiltered);
    setDirtyRows(new Set());
    setIsDirty(false);
  };

  const handleCellChange = (
    skuId: string,
    pinCode: string,
    field: "stock_on_hand" | "reorder_point",
    value: string
  ) => {
    const key = `${skuId}:${pinCode}`;
    setDirtyRows((prev) => new Set(prev).add(key));
    setIsDirty(true);
    setLocalInventory((prev) =>
      prev.map((row) =>
        row.sku_id === skuId && row.pin_code === pinCode
          ? { ...row, [field]: parseInt(value) || 0 }
          : row
      )
    );
  };

  const handleSaveAll = () => {
    console.log("Saving:", Array.from(dirtyRows));
    setDirtyRows(new Set());
    setIsDirty(false);
  };

  const handleDiscard = () => {
    let filtered = [...mockInventory];
    if (filters.pin_code !== "all") {
      filtered = filtered.filter((r) => r.pin_code === filters.pin_code);
    }
    if (filters.category !== "all") {
      filtered = filtered.filter((r) => r.category === filters.category);
    }
    setLocalInventory(filtered);
    setDirtyRows(new Set());
    setIsDirty(false);
  };

  return (
    <div>
      <PageHeader
        title="Current Inventory"
        description="Manage stock levels for each SKU at each PIN code"
      />

      <ActionRow>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <Button onClick={handleSaveAll} disabled={!isDirty} className="gap-2">
            <Save className="h-4 w-4" /> Save All
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={filters.pin_code}
            onChange={(e) => setFilters({ ...filters, pin_code: e.target.value })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All PIN Codes</option>
            {mockPINCodes.map((p) => (
              <option key={p.pin_code} value={p.pin_code}>
                {p.pin_code} — {p.area_name}
              </option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Categories</option>
            {SKU_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <Button onClick={handleApplyFilters} className="text-sm">
            Apply Filters
          </Button>
        </div>
      </ActionRow>

      {filteredInventory.length === 0 ? (
        <EmptyState
          title="No inventory data"
          description="Import or add inventory records to start tracking stock levels"
          actionLabel="Import CSV"
          onAction={() => {}}
        />
      ) : (
        <>
          <div className="rounded-lg border bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50 text-left">
                    <th className="px-4 py-3 text-sm font-medium text-slate-600">SKU ID</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-600">Product Name</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-600">Category</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-600">PIN Code</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-600">Stock on Hand</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-600">Reorder Point</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((record) => {
                    const status = getInventoryStatus(record);
                    const key = `${record.sku_id}:${record.pin_code}`;
                    const isDirtyRow = dirtyRows.has(key);

                    return (
                      <tr
                        key={key}
                        className={cn(
                          "border-b last:border-0",
                          isDirtyRow && "bg-amber-50"
                        )}
                      >
                        <td className="px-4 py-3 font-mono text-sm">{record.sku_id}</td>
                        <td className="px-4 py-3 font-medium">{record.sku_name}</td>
                        <td className="px-4 py-3">
                          {record.category && <CategoryTag category={record.category} />}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">{record.pin_code}</td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={record.stock_on_hand}
                            onChange={(e) =>
                              handleCellChange(
                                record.sku_id,
                                record.pin_code,
                                "stock_on_hand",
                                e.target.value
                              )
                            }
                            className="h-9 w-24"
                            min="0"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={record.reorder_point}
                            onChange={(e) =>
                              handleCellChange(
                                record.sku_id,
                                record.pin_code,
                                "reorder_point",
                                e.target.value
                              )
                            }
                            className="h-9 w-24"
                            min="0"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {isDirty && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
              <div className="container mx-auto flex items-center justify-between max-w-7xl">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">{dirtyRows.size} unsaved changes</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={handleDiscard}>
                    Discard
                  </Button>
                  <Button onClick={handleSaveAll}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
