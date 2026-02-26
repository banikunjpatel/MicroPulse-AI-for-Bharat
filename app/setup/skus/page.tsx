"use client";

import { useState } from "react";
import { SKU, SKUCategory, SKU_CATEGORIES } from "@/types";
import { mockSKUs } from "@/lib/mock-data";
import { PageHeader } from "@/components/setup/PageHeader";
import { ActionRow } from "@/components/setup/ActionRow";
import { EmptyState } from "@/components/setup/EmptyState";
import { StatusBadge } from "@/components/setup/StatusBadge";
import { CategoryTag } from "@/components/setup/CategoryTag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Edit2, X, Check, Plus } from "lucide-react";
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

export default function SKUCatalogPage() {
  const [skus, setSkus] = useState<SKU[]>(mockSKUs);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewRow, setShowNewRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Partial<SKU>>({});
  const [newRowErrors, setNewRowErrors] = useState<string[]>([]);
  const [editRowData, setEditRowData] = useState<Partial<SKU>>({});
  const [editRowErrors, setEditRowErrors] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const formatCurrency = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  const handleSaveNew = () => {
    const errors = validateSKU(newRowData);
    if (errors.length > 0) {
      setNewRowErrors(errors);
      return;
    }
    
    const newId = `SKU-${String(skus.length + 1).padStart(3, "0")}`;
    const newSKU: SKU = {
      id: newId,
      name: newRowData.name!,
      category: newRowData.category as SKUCategory,
      unit_cost_paise: newRowData.unit_cost_paise!,
      lead_time_days: newRowData.lead_time_days!,
      status: "no_history",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setSkus([...skus, newSKU]);
    setShowNewRow(false);
    setNewRowData({});
    setNewRowErrors([]);
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

    setSkus(skus.map(s => 
      s.id === editingId 
        ? { ...s, ...editRowData, updated_at: new Date().toISOString() }
        : s
    ));
    setEditingId(null);
    setEditRowData({});
    setEditRowErrors([]);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditRowData({});
    setEditRowErrors([]);
  };

  const handleDelete = (id: string) => {
    setSkus(skus.filter(s => s.id !== id));
    setDeleteConfirm(null);
  };

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
          <Button variant="outline" className="gap-2">
            Import CSV
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
                            <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="h-8 w-8 p-0">
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
                        <Button size="sm" variant="ghost" onClick={handleSaveNew} className="h-8 w-8 p-0">
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
              <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
