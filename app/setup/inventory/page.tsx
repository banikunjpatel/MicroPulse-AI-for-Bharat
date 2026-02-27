"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InventoryRecord, InventoryStatus, SKUCategory, SKU_CATEGORIES } from "@/types";
import { PageHeader } from "@/components/setup/PageHeader";
import { ActionRow } from "@/components/setup/ActionRow";
import { EmptyState } from "@/components/setup/EmptyState";
import { StatusBadge } from "@/components/setup/StatusBadge";
import { CategoryTag } from "@/components/setup/CategoryTag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Save, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const getInventoryStatus = (record: InventoryRecord): InventoryStatus => {
  if (!record.reorder_point || record.reorder_point === 0) return "healthy";
  const ratio = record.stock_on_hand / record.reorder_point;
  if (ratio >= 1.5) return "healthy";
  if (ratio >= 0.8) return "low";
  return "critical";
};

interface DbInventoryRecord {
  sku_id: string;
  pin_code: string;
  stock_on_hand: number;
  reorder_point: number;
  last_updated: string;
  sku_name?: string;
  category?: string;
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ pin_code: "all", category: "all" });
  const [edits, setEdits] = useState<Record<string, InventoryRecord>>({});
  const [isDirty, setIsDirty] = useState(false);

  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ["inventory", filters.pin_code, filters.category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.pin_code !== "all") params.set("pin", filters.pin_code);
      if (filters.category !== "all") params.set("category", filters.category);
      
      const res = await fetch(`/api/inventory?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data as { records: DbInventoryRecord[]; total: number };
    },
  });

  const localInventory = (inventoryData?.records ?? []).map((r) => {
    const key = `${r.sku_id}:${r.pin_code}`;
    return edits[key] ?? {
      sku_id: r.sku_id,
      pin_code: r.pin_code,
      stock_on_hand: r.stock_on_hand,
      reorder_point: r.reorder_point,
      last_updated: r.last_updated,
      sku_name: r.sku_name,
      category: r.category as SKUCategory,
    };
  });

  const updateMutation = useMutation({
    mutationFn: async (records: InventoryRecord[]) => {
      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setEdits({});
      setIsDirty(false);
    },
  });

  const handleCellChange = (
    skuId: string,
    pinCode: string,
    field: "stock_on_hand" | "reorder_point",
    value: string
  ) => {
    const key = `${skuId}:${pinCode}`;
    const numValue = parseInt(value) || 0;
    
    setEdits((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {
          sku_id: skuId,
          pin_code: pinCode,
          stock_on_hand: 0,
          reorder_point: 0,
        }),
        [field]: numValue,
      },
    }));
    setIsDirty(true);
  };

  const handleSaveAll = () => {
    const dirtyRecords = Object.values(edits);
    updateMutation.mutate(dirtyRecords);
  };

  const handleDiscard = () => {
    setEdits({});
    setIsDirty(false);
  };

  const isDirtyRow = (skuId: string, pinCode: string) => {
    return !!edits[`${skuId}:${pinCode}`];
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Current Inventory"
          description="Manage stock levels for each SKU at each PIN code"
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
            <option value="395001">395001 — Surat</option>
            <option value="395002">395002 — Varachha</option>
            <option value="400001">400001 — Mumbai</option>
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
        </div>
      </ActionRow>

      {localInventory.length === 0 ? (
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
                  {localInventory.map((record) => {
                    const status = getInventoryStatus(record);
                    const key = `${record.sku_id}:${record.pin_code}`;
                    const rowIsDirty = isDirtyRow(record.sku_id, record.pin_code);

                    return (
                      <tr
                        key={key}
                        className={cn(
                          "border-b last:border-0",
                          rowIsDirty && "bg-amber-50"
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
                  <span className="font-medium">{Object.keys(edits).length} unsaved changes</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={handleDiscard}>
                    Discard
                  </Button>
                  <Button onClick={handleSaveAll} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
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
