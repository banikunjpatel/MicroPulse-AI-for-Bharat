"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SKU, SKUCategory, SKU_CATEGORIES } from "@/types";
import { PageHeader } from "@/components/setup/PageHeader";
import { ActionRow } from "@/components/setup/ActionRow";
import { EmptyState } from "@/components/setup/EmptyState";
import { StatusBadge } from "@/components/setup/StatusBadge";
import { CategoryTag } from "@/components/setup/CategoryTag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, X, Check, Plus, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const validateSKU = (data: Partial<SKU>): string[] => {
  const errors: string[] = [];
  if (!data.name?.trim()) errors.push("Product name is required");
  if (data.name && data.name.length > 100) errors.push("Name must be under 100 characters");
  if (!data.category) errors.push("Category is required");
  if (!data.unit_cost_paise || data.unit_cost_paise < 100) errors.push("Unit cost must be at least ₹1");
  if (!data.lead_time_days || data.lead_time_days < 1 || data.lead_time_days > 90) errors.push("Lead time must be 1–90 days");
  return errors;
};

function mapDbToSKU(dbSku: {
  id: string;
  name: string;
  category: string;
  unitCostPaise: number;
  leadTimeDays: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): SKU {
  return {
    id: dbSku.id,
    name: dbSku.name,
    category: dbSku.category as SKUCategory,
    unit_cost_paise: dbSku.unitCostPaise,
    lead_time_days: dbSku.leadTimeDays,
    status: dbSku.status as "active" | "inactive" | "no_history",
    created_at: dbSku.createdAt.toISOString(),
    updated_at: dbSku.updatedAt.toISOString(),
  };
}

export default function SKUCatalogPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewRow, setShowNewRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Partial<SKU>>({});
  const [newRowErrors, setNewRowErrors] = useState<string[]>([]);
  const [editRowData, setEditRowData] = useState<Partial<SKU>>({});
  const [editRowErrors, setEditRowErrors] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const { data: skusData, isLoading } = useQuery({
    queryKey: ["skus"],
    queryFn: async () => {
      const res = await fetch("/api/skus");
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      
      // Map camelCase from DB to snake_case for frontend
      const mappedSkus = (json.data.skus as Array<{
        id: string;
        name: string;
        category: string;
        unitCostPaise: number;
        leadTimeDays: number;
        status: string;
        createdAt: string;
        updatedAt: string;
      }>).map(sku => ({
        id: sku.id,
        name: sku.name,
        category: sku.category as SKUCategory,
        unit_cost_paise: sku.unitCostPaise,
        lead_time_days: sku.leadTimeDays,
        status: sku.status as "active" | "inactive" | "no_history",
        created_at: sku.createdAt,
        updated_at: sku.updatedAt,
      }));
      
      return { skus: mappedSkus, total: json.data.total };
    },
  });

  const skus = skusData?.skus ?? [];

  const createMutation = useMutation({
    mutationFn: async (sku: Partial<SKU>) => {
      const res = await fetch("/api/skus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sku),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data as SKU;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skus"] });
      setShowNewRow(false);
      setNewRowData({});
      setNewRowErrors([]);
    },
    onError: (error: Error) => {
      setNewRowErrors([error.message]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SKU> }) => {
      const res = await fetch(`/api/skus/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data as SKU;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skus"] });
      setEditingId(null);
      setEditRowData({});
      setEditRowErrors([]);
    },
    onError: (error: Error) => {
      setEditRowErrors([error.message]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/skus/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skus"] });
      setDeleteConfirm(null);
    },
    onError: (error: Error) => {
      alert(error.message);
      setDeleteConfirm(null);
    },
  });

  const formatCurrency = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  const handleSaveNew = () => {
    const errors = validateSKU(newRowData);
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

  const handleEdit = (sku: SKU) => {
    setEditingId(sku.id);
    setEditRowData({ ...sku });
    setEditRowErrors([]);
  };

  const handleSaveEdit = () => {
    const errors = validateSKU(editRowData);
    if (errors.length > 0) {
      setEditRowErrors(errors);
      return;
    }
    updateMutation.mutate({ id: editingId!, data: editRowData });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditRowData({});
    setEditRowErrors([]);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="SKU Catalog"
          description="Manage your product inventory for demand forecasting"
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
        title="SKU Catalog"
        description="Manage your product inventory for demand forecasting"
      />

      <ActionRow>
        <div className="flex items-center gap-4">
          <Button onClick={() => setShowNewRow(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add SKU
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowImportModal(true)}>
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{skus.length} SKUs total</p>
      </ActionRow>

      {skus.length === 0 && !showNewRow ? (
        <EmptyState
          title="No SKUs yet"
          description="Add your first SKU to start tracking products for demand forecasting"
          actionLabel="Add SKU"
          onAction={() => setShowNewRow(true)}
        />
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50 text-left">
                  <th className="px-4 py-3 text-sm font-medium text-slate-600">SKU ID</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-600">Product Name</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-600">Category</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-600">Unit Cost</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-600">Lead Time</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {skus.map((sku) => (
                  <tr key={sku.id} className="border-b last:border-0">
                    {editingId === sku.id ? (
                      <>
                        <td className="px-4 py-3 font-mono text-sm">{sku.id}</td>
                        <td className="px-4 py-3">
                          <Input
                            value={editRowData.name || ""}
                            onChange={(e) => setEditRowData({ ...editRowData, name: e.target.value })}
                            className="h-9"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={editRowData.category || ""}
                            onChange={(e) => setEditRowData({ ...editRowData, category: e.target.value as SKUCategory })}
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                          >
                            <option value="">Select category</option>
                            {SKU_CATEGORIES.map((cat) => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={(editRowData.unit_cost_paise || 0) / 100}
                            onChange={(e) => setEditRowData({ ...editRowData, unit_cost_paise: Math.round(parseFloat(e.target.value) * 100) })}
                            className="h-9 w-24"
                            min="1"
                            step="0.01"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={editRowData.lead_time_days || ""}
                            onChange={(e) => setEditRowData({ ...editRowData, lead_time_days: parseInt(e.target.value) })}
                            className="h-9 w-16"
                            min="1"
                            max="90"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={sku.status} />
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
                        <td className="px-4 py-3 font-mono text-sm">{sku.id}</td>
                        <td className="px-4 py-3 font-medium">{sku.name}</td>
                        <td className="px-4 py-3">
                          <CategoryTag category={sku.category} />
                        </td>
                        <td className="px-4 py-3">{formatCurrency(sku.unit_cost_paise)}</td>
                        <td className="px-4 py-3">{sku.lead_time_days} days</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={sku.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(sku)} className="h-8 w-8 p-0">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(sku.id)} className="h-8 w-8 p-0">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                
                {showNewRow && (
                  <tr className="border-b bg-cyan-50">
                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                      SKU-{String(skus.length + 1).padStart(3, "0")}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={newRowData.name || ""}
                        onChange={(e) => setNewRowData({ ...newRowData, name: e.target.value })}
                        placeholder="Product name"
                        className="h-9"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={newRowData.category || ""}
                        onChange={(e) => setNewRowData({ ...newRowData, category: e.target.value as SKUCategory })}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Select category</option>
                        {SKU_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        placeholder="0.00"
                        onChange={(e) => setNewRowData({ ...newRowData, unit_cost_paise: Math.round(parseFloat(e.target.value) * 100) })}
                        className="h-9 w-24"
                        min="1"
                        step="0.01"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        placeholder="1"
                        onChange={(e) => setNewRowData({ ...newRowData, lead_time_days: parseInt(e.target.value) })}
                        className="h-9 w-16"
                        min="1"
                        max="90"
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
            <div className="px-4 py-3 bg-red-50 border-t border-red-200">
              {(newRowErrors.length > 0 ? newRowErrors : editRowErrors).map((error, i) => (
                <p key={i} className="text-sm text-red-600">{error}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Confirm Delete</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete SKU {deleteConfirm}? This will also remove all associated inventory and forecast data.
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

      {showImportModal && (
        <CSVImportModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["skus"] });
            setShowImportModal(false);
          }}
        />
      )}
    </div>
  );
}

function CSVImportModal({ onClose, onImportComplete }: { onClose: () => void; onImportComplete: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith(".csv")) {
      setErrors(["Please select a CSV file"]);
      return;
    }

    setFile(selectedFile);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.trim().split("\n");
      if (lines.length < 2) {
        setErrors(["CSV file is empty or has no data rows"]);
        return;
      }
      
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const requiredCols = ["name", "category", "unit_cost", "lead_time_days"];
      const missing = requiredCols.filter(c => !headers.includes(c));
      if (missing.length > 0) {
        setErrors([`Missing required columns: ${missing.join(", ")}`]);
        return;
      }

      const data: Record<string, string>[] = [];
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        const values = lines[i].split(",").map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || "";
        });
        data.push(row);
      }
      setPreview(data);
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!file) return;
    
    setImporting(true);
    setErrors([]);

    try {
      const text = await file.text();
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      
      const skuList: Record<string, string | number>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim());
        const row: Record<string, string | number> = {};
        headers.forEach((h, idx) => {
          if (h === "unit_cost") {
            row.unit_cost_paise = Math.round(parseFloat(values[idx]) * 100);
          } else {
            row[h] = values[idx];
          }
        });
        skuList.push(row);
      }

      const res = await fetch("/api/skus/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skus: skuList }),
      });
      
      const json = await res.json();
      if (!json.success) {
        setErrors([json.error.message]);
        return;
      }
      
      setResult({ created: json.data.created_count, skipped: json.data.skipped_count });
      setTimeout(() => {
        onImportComplete();
      }, 1500);
    } catch (err) {
      setErrors(["Failed to import SKUs"]);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Import SKUs from CSV</h3>
          <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select CSV File</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Required columns: name, category, unit_cost, lead_time_days
          </p>
        </div>

        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg">
            {errors.map((err, i) => (
              <p key={i} className="text-sm text-red-600">{err}</p>
            ))}
          </div>
        )}

        {result && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              Successfully imported {result.created} SKUs ({result.skipped} skipped as duplicates)
            </p>
          </div>
        )}

        {preview.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Preview (first 5 rows)</h4>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    {Object.keys(preview[0]).map(key => (
                      <th key={key} className="px-3 py-2 text-left font-medium">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-3 py-2">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={!file || preview.length === 0 || importing}>
            {importing ? "Importing..." : `Import ${preview.length > 0 ? preview.length + (parseInt(preview.length.toString()) || 0) - 5 : ""} SKUs`}
          </Button>
        </div>
      </div>
    </div>
  );
}
