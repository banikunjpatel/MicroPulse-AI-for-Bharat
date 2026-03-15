/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/setup/PageHeader";
import { StepIndicator } from "@/components/setup/StepIndicator";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, ArrowRight, AlertCircle, Loader2, FileCheck, FileX,
  Package, MapPin, PlusCircle, CheckSquare, Square,
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Map Columns" },
  { id: 3, label: "Validate" },
  { id: 4, label: "Confirm" },
];

const SKU_CATEGORIES = [
  { value: "beverages", label: "Beverages" },
  { value: "snacks", label: "Snacks" },
  { value: "dairy", label: "Dairy" },
  { value: "personal_care", label: "Personal Care" },
  { value: "household", label: "Household" },
  { value: "other", label: "Other" },
];

interface ValidationError {
  row: number;
  column: string;
  value: string;
  issue: string;
}

interface NewSkuProposal {
  sku_id: string;
  name: string;
  category: "beverages" | "snacks" | "dairy" | "personal_care" | "household" | "other";
  unit_cost_paise: number;
  lead_time_days: number;
}

interface ValidationSummary {
  missing_skus: string[];
  new_sku_proposals: NewSkuProposal[];
  missing_pins: string[];
  valid_skus: string[];
  valid_pins: string[];
  has_missing_skus: boolean;
  has_missing_pins: boolean;
}

interface ValidationResult {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  errors: ValidationError[];
  can_proceed: boolean;
  validation_summary: ValidationSummary;
}

const SYNTHETIC_RESULT: ValidationResult = {
  total_rows: 6480,
  valid_rows: 6480,
  invalid_rows: 0,
  errors: [],
  can_proceed: true,
  validation_summary: {
    missing_skus: [],
    new_sku_proposals: [],
    missing_pins: [],
    valid_skus: [],
    valid_pins: [],
    has_missing_skus: false,
    has_missing_pins: false,
  },
};

function getInitialSession() {
  if (typeof window === "undefined") return null;
  const session = sessionStorage.getItem("upload_session");
  if (!session) return null;
  try { return JSON.parse(session); } catch { return null; }
}

export default function ValidatePage() {
  const router = useRouter();
  const [sessionData, setSessionData] = useState<{ is_synthetic: boolean; session_id: string } | null>(null);
  // Editable proposals + approval state
  const [skuProposals, setSkuProposals] = useState<NewSkuProposal[]>([]);
  const [approvedSkuIds, setApprovedSkuIds] = useState<Set<string>>(new Set());

  const validateMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch("/api/sales-history/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data as ValidationResult;
    },
    onSuccess: (data) => {
      const proposals = data.validation_summary?.new_sku_proposals ?? [];
      setSkuProposals(proposals);
      // Default: approve all
      setApprovedSkuIds(new Set(proposals.map((p) => p.sku_id)));
    },
  });

  useEffect(() => {
    const data = getInitialSession();
    if (!data) { router.replace("/setup/sales-history"); return; }
    setSessionData(data);
  }, [router]);

  useEffect(() => {
    if (sessionData && !sessionData.is_synthetic && !validateMutation.isPending && !validateMutation.isSuccess) {
      validateMutation.mutate(sessionData.session_id);
    }
  }, [sessionData]);

  const validationResult = useMemo(() => {
    if (!sessionData) return null;
    if (sessionData.is_synthetic) return SYNTHETIC_RESULT;
    if (validateMutation.isSuccess && validateMutation.data) return validateMutation.data;
    return null;
  }, [sessionData, validateMutation.isSuccess, validateMutation.data]);

  const toggleApproval = (skuId: string) => {
    setApprovedSkuIds((prev) => {
      const next = new Set(prev);
      if (next.has(skuId)) next.delete(skuId); else next.add(skuId);
      return next;
    });
  };

  const approveAll = () => setApprovedSkuIds(new Set(skuProposals.map((p) => p.sku_id)));
  const rejectAll = () => setApprovedSkuIds(new Set());

  const updateProposal = (skuId: string, field: keyof NewSkuProposal, value: string | number) => {
    setSkuProposals((prev) =>
      prev.map((p) => (p.sku_id === skuId ? { ...p, [field]: value } : p))
    );
  };

  const handleProceed = () => {
    // Persist approved SKUs to sessionStorage so confirm page can send them
    const approvedList = skuProposals.filter((p) => approvedSkuIds.has(p.sku_id));
    const existing = getInitialSession();
    sessionStorage.setItem("upload_session", JSON.stringify({ ...existing, approved_skus: approvedList }));
    router.push("/setup/sales-history/confirm");
  };

  const isLoading = !sessionData || (validateMutation.isPending && !sessionData?.is_synthetic);
  const hasErrors = validationResult && validationResult.invalid_rows > 0;
  const canProceed = validationResult?.can_proceed ?? false;
  const validationSummary = validationResult?.validation_summary;
  const hasMissingSkus = validationSummary?.has_missing_skus ?? false;

  if (!sessionData) return <div><PageHeader title="Loading..." description="Please wait" /></div>;

  return (
    <div>
      <PageHeader title="Validate Data" description="Review and validate your sales data before importing" />
      <StepIndicator steps={STEPS} currentStep={3} />

      {isLoading && (
        <div className="rounded-lg border bg-white p-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-600" />
          <p className="mt-4 text-muted-foreground">Validating your data...</p>
        </div>
      )}

      {!isLoading && validationResult && (
        <>
          {/* Row counts */}
          <div className="rounded-lg border bg-white p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              {hasErrors ? (
                <div className="rounded-full bg-red-100 p-3"><FileX className="h-6 w-6 text-red-600" /></div>
              ) : (
                <div className="rounded-full bg-green-100 p-3"><FileCheck className="h-6 w-6 text-green-600" /></div>
              )}
              <div>
                <h2 className="text-lg font-semibold">
                  {hasErrors ? "Validation Issues Found" : "Validation Passed"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {validationResult.total_rows} total rows, {validationResult.valid_rows} valid, {validationResult.invalid_rows} invalid
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-muted-foreground">Total Rows</p>
                <p className="text-2xl font-semibold">{validationResult.total_rows.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-green-600">Valid Rows</p>
                <p className="text-2xl font-semibold text-green-700">{validationResult.valid_rows.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-600">Invalid Rows</p>
                <p className="text-2xl font-semibold text-red-700">{validationResult.invalid_rows.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* SKU / PIN summary */}
          {validationSummary && (
            <div className="rounded-lg border bg-white p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Data Summary</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50">
                  <Package className="h-5 w-5 text-cyan-600 mt-0.5" />
                  <div>
                    <p className="font-medium">SKUs</p>
                    <p className="text-sm text-muted-foreground">
                      {validationSummary.valid_skus.length} existing / {validationSummary.missing_skus.length} new
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50">
                  <MapPin className="h-5 w-5 text-cyan-600 mt-0.5" />
                  <div>
                    <p className="font-medium">PIN Codes</p>
                    <p className="text-sm text-muted-foreground">
                      {validationSummary.valid_pins.length} valid / {validationSummary.missing_pins.length} will be auto-created
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* New SKU approval panel */}
          {hasMissingSkus && skuProposals.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 mb-6">
              <div className="px-6 py-4 border-b border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-800">
                    New SKUs Found ({skuProposals.length}) — Approve to Create
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={rejectAll} className="text-xs">
                    <Square className="h-3 w-3 mr-1" /> Reject All
                  </Button>
                  <Button size="sm" onClick={approveAll} className="text-xs bg-amber-600 hover:bg-amber-700 text-white">
                    <CheckSquare className="h-3 w-3 mr-1" /> Approve All
                  </Button>
                </div>
              </div>
              <p className="px-6 py-3 text-sm text-amber-700 border-b border-amber-200">
                These SKU IDs were found in your CSV but don&apos;t exist yet. Approve the ones you want created automatically during import. You can edit the name, category, cost, and lead time before approving.
              </p>
              <div className="divide-y divide-amber-100">
                {skuProposals.map((proposal) => {
                  const isApproved = approvedSkuIds.has(proposal.sku_id);
                  return (
                    <div key={proposal.sku_id} className={`px-6 py-4 transition-colors ${isApproved ? "bg-white" : "bg-amber-50/60 opacity-60"}`}>
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleApproval(proposal.sku_id)}
                          className="mt-1 text-amber-600 hover:text-amber-800 flex-shrink-0"
                          aria-label={isApproved ? "Unapprove SKU" : "Approve SKU"}
                        >
                          {isApproved
                            ? <CheckSquare className="h-5 w-5 text-green-600" />
                            : <Square className="h-5 w-5" />}
                        </button>
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">CSV SKU ID</Label>
                            <p className="font-mono text-sm font-medium">{proposal.sku_id}</p>
                          </div>
                          <div>
                            <Label htmlFor={`name-${proposal.sku_id}`} className="text-xs text-muted-foreground">Product Name</Label>
                            <Input
                              id={`name-${proposal.sku_id}`}
                              value={proposal.name}
                              onChange={(e) => updateProposal(proposal.sku_id, "name", e.target.value)}
                              disabled={!isApproved}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`cat-${proposal.sku_id}`} className="text-xs text-muted-foreground">Category</Label>
                            <Select
                              value={proposal.category}
                              onValueChange={(v) => updateProposal(proposal.sku_id, "category", v)}
                              disabled={!isApproved}
                            >
                              <SelectTrigger id={`cat-${proposal.sku_id}`} className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SKU_CATEGORIES.map((c) => (
                                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor={`cost-${proposal.sku_id}`} className="text-xs text-muted-foreground">Cost (₹)</Label>
                              <Input
                                id={`cost-${proposal.sku_id}`}
                                type="number"
                                min={1}
                                value={proposal.unit_cost_paise / 100}
                                onChange={(e) => updateProposal(proposal.sku_id, "unit_cost_paise", Math.round(parseFloat(e.target.value || "1") * 100))}
                                disabled={!isApproved}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`lead-${proposal.sku_id}`} className="text-xs text-muted-foreground">Lead (days)</Label>
                              <Input
                                id={`lead-${proposal.sku_id}`}
                                type="number"
                                min={1}
                                max={90}
                                value={proposal.lead_time_days}
                                onChange={(e) => updateProposal(proposal.sku_id, "lead_time_days", parseInt(e.target.value || "7"))}
                                disabled={!isApproved}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-6 py-3 bg-amber-50 border-t border-amber-200 text-sm text-amber-700">
                {approvedSkuIds.size} of {skuProposals.length} new SKUs approved for creation
              </div>
            </div>
          )}

          {/* Validation errors table */}
          {validationResult.errors.length > 0 && (
            <div className="rounded-lg border bg-white overflow-hidden mb-6">
              <div className="px-6 py-4 border-b bg-red-50">
                <h3 className="font-semibold text-red-700">Validation Errors (showing first 10)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="px-4 py-2 text-left font-medium text-slate-600">Row</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">Column</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">Value</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResult.errors.map((error: ValidationError, i: number) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-4 py-2 font-mono">{error.row}</td>
                        <td className="px-4 py-2">{error.column}</td>
                        <td className="px-4 py-2 font-mono text-muted-foreground">{error.value || "(empty)"}</td>
                        <td className="px-4 py-2 text-red-600">{error.issue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {hasErrors && !canProceed && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">Too many invalid rows. Please fix your CSV and upload again.</p>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handleProceed} disabled={!canProceed}>
              Continue to Import <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
