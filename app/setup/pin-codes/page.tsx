"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PINCode, Region, REGIONS } from "@/types";
import { PageHeader } from "@/components/setup/PageHeader";
import { ActionRow } from "@/components/setup/ActionRow";
import { EmptyState } from "@/components/setup/EmptyState";
import { StatusBadge } from "@/components/setup/StatusBadge";
import { ReadinessPanel } from "@/components/setup/ReadinessPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, X, Check, Plus, Rocket, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const validatePINCode = (data: Partial<PINCode>): string[] => {
  const errors: string[] = [];
  if (!data.pin_code?.match(/^\d{6}$/)) errors.push("PIN code must be exactly 6 digits");
  if (!data.area_name?.trim()) errors.push("Area name is required");
  if (!data.region) errors.push("Region is required");
  if (data.store_count !== undefined && data.store_count < 0) errors.push("Store count cannot be negative");
  return errors;
};

export default function PINCodesPage() {
  const queryClient = useQueryClient();
  const [showNewRow, setShowNewRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Partial<PINCode>>({});
  const [newRowErrors, setNewRowErrors] = useState<string[]>([]);
  const [editingPIN, setEditingPIN] = useState<string | null>(null);
  const [editRowData, setEditRowData] = useState<Partial<PINCode>>({});
  const [editRowErrors, setEditRowErrors] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: pinCodesData, isLoading } = useQuery({
    queryKey: ["pin-codes"],
    queryFn: async () => {
      const res = await fetch("/api/pin-codes");
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);

      const mappedPins = (json.data.pin_codes as Array<{
        pin_code: string;
        area_name: string;
        region: string;
        store_count: number;
        status: string;
      }>).map((pin) => ({
        pin_code: pin.pin_code,
        area_name: pin.area_name,
        region: pin.region as Region,
        store_count: pin.store_count,
        status: pin.status as "active" | "inactive",
      }));

      return { pin_codes: mappedPins, total: json.data.total };
    },
  });

  const pinCodes = pinCodesData?.pin_codes ?? [];

  const createMutation = useMutation({
    mutationFn: async (pin: Partial<PINCode>) => {
      const res = await fetch("/api/pin-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pin),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data as PINCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pin-codes"] });
      setShowNewRow(false);
      setNewRowData({});
      setNewRowErrors([]);
    },
    onError: (error: Error) => {
      setNewRowErrors([error.message]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ pin, data }: { pin: string; data: Partial<PINCode> }) => {
      const res = await fetch(`/api/pin-codes/${pin}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data as PINCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pin-codes"] });
      setEditingPIN(null);
      setEditRowData({});
      setEditRowErrors([]);
    },
    onError: (error: Error) => {
      setEditRowErrors([error.message]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (pin: string) => {
      const res = await fetch(`/api/pin-codes/${pin}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pin-codes"] });
      setDeleteConfirm(null);
    },
    onError: (error: Error) => {
      alert(error.message);
      setDeleteConfirm(null);
    },
  });

  const handleSaveNew = () => {
    const errors = validatePINCode(newRowData);
    if (errors.length > 0) {
      setNewRowErrors(errors);
      return;
    }
    createMutation.mutate(newRowData);
  };

  const handleCancelNew = () => {
    setShowNewRow(false);
    setNewRowData({});
    setNewRowErrors([]);
  };

  const handleEdit = (pin: PINCode) => {
    setEditingPIN(pin.pin_code);
    setEditRowData({ ...pin });
    setEditRowErrors([]);
  };

  const handleSaveEdit = () => {
    const errors = validatePINCode(editRowData);
    if (errors.length > 0) {
      setEditRowErrors(errors);
      return;
    }
    updateMutation.mutate({ pin: editingPIN!, data: editRowData });
  };

  const handleCancelEdit = () => {
    setEditingPIN(null);
    setEditRowData({});
    setEditRowErrors([]);
  };

  const handleDelete = (pinCode: string) => {
    deleteMutation.mutate(pinCode);
  };

  const handleRunForecast = () => {
    console.log("Triggering forecast...");
  };

  const readiness = {
    skus: { ok: false, count: 0 },
    sales_history: { ok: false, days_of_data: 0 },
    inventory: { ok: false, missing_count: 0 },
    pin_codes: { ok: pinCodes.filter((p) => p.status === "active").length > 0, count: pinCodes.filter((p) => p.status === "active").length },
    all_clear: pinCodes.filter((p) => p.status === "active").length > 0,
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Stores & PIN Codes"
          description="Manage geographic zones and check data readiness"
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
        title="Stores & PIN Codes"
        description="Manage geographic zones and check data readiness"
      />

      <div className="mb-8">
        <ActionRow>
          <div className="flex items-center gap-4">
            <Button onClick={() => setShowNewRow(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add PIN Code
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {pinCodes.filter((p) => p.status === "active").length} active zones
          </p>
        </ActionRow>

        {pinCodes.length === 0 && !showNewRow ? (
          <EmptyState
            title="No PIN codes yet"
            description="Add PIN codes to define the geographic zones for forecasting"
            actionLabel="Add PIN Code"
            onAction={() => setShowNewRow(true)}
          />
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50 text-left">
                    <th className="px-4 py-3 text-sm font-medium text-slate-600">PIN Code</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-600">City / Area Name</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-600">Region</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-600">Store Count</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pinCodes.map((pin, idx) => (
                    <tr key={`${pin.pin_code}-${idx}`} className="border-b last:border-0">
                      {editingPIN === pin.pin_code ? (
                        <>
                          <td className="px-4 py-3 font-mono text-sm">{pin.pin_code}</td>
                          <td className="px-4 py-3">
                            <Input
                              value={editRowData.area_name || ""}
                              onChange={(e) => setEditRowData({ ...editRowData, area_name: e.target.value })}
                              className="h-9"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={editRowData.region || ""}
                              onChange={(e) => setEditRowData({ ...editRowData, region: e.target.value as Region })}
                              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                              <option value="">Select region</option>
                              {REGIONS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              value={editRowData.store_count || 0}
                              onChange={(e) => setEditRowData({ ...editRowData, store_count: parseInt(e.target.value) })}
                              className="h-9 w-20"
                              min="0"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={pin.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="h-8 w-8 p-0" disabled={updateMutation.isPending}>
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-8 w-8 p-0">
                                <X className="h-4 w-4 text-slate-400" />
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-mono text-sm font-medium">{pin.pin_code}</td>
                          <td className="px-4 py-3">{pin.area_name}</td>
                          <td className="px-4 py-3">{pin.region}</td>
                          <td className="px-4 py-3">{pin.store_count}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={pin.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(pin)} className="h-8 w-8 p-0">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(pin.pin_code)} className="h-8 w-8 p-0">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}

                  {showNewRow && (
                    <tr key="new-pin-row" className="border-b bg-cyan-50">
                      <td className="px-4 py-3">
                        <Input
                          value={newRowData.pin_code || ""}
                          onChange={(e) => setNewRowData({ ...newRowData, pin_code: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                          placeholder="6-digit PIN"
                          className="h-9 w-28 font-mono"
                          maxLength={6}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={newRowData.area_name || ""}
                          onChange={(e) => setNewRowData({ ...newRowData, area_name: e.target.value })}
                          placeholder="City — Area"
                          className="h-9"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={newRowData.region || ""}
                          onChange={(e) => setNewRowData({ ...newRowData, region: e.target.value as Region })}
                          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="">Select region</option>
                          {REGIONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          value={newRowData.store_count || ""}
                          onChange={(e) => setNewRowData({ ...newRowData, store_count: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                          className="h-9 w-20"
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">—</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={handleSaveNew} className="h-8 w-8 p-0" disabled={createMutation.isPending}>
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelNew} className="h-8 w-8 p-0">
                            <X className="h-4 w-4 text-slate-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {(newRowErrors.length > 0 || editRowErrors.length > 0) && (
              <div className="px-4 py-3 bg-red-50 border-t border-red-200" key="error-banner">
                {(newRowErrors.length > 0 ? newRowErrors : editRowErrors).map((error, i) => (
                  <p key={i} className="text-sm text-red-600">{error}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <hr className="my-8" />

      <ReadinessPanel readiness={readiness} />

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleRunForecast}
          disabled={!readiness.all_clear}
          className={cn(
            "gap-2",
            readiness.all_clear
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              : "opacity-50 cursor-not-allowed"
          )}
        >
          <Rocket className="h-4 w-4" />
          Run Forecast Model →
        </Button>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Confirm Delete</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete PIN code {deleteConfirm}? This will also remove all associated inventory data.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
