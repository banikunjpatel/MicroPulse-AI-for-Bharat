"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/setup/PageHeader";
import { StepIndicator } from "@/components/setup/StepIndicator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { ColumnMapping } from "@/types";

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Map Columns" },
  { id: 3, label: "Validate" },
  { id: 4, label: "Confirm" },
];

const AUTO_DETECT_MAP: Record<keyof ColumnMapping, string[]> = {
  date_col: ["date", "sale_date", "txn_date", "transaction_date", "order_date"],
  sku_id_col: ["sku_id", "sku", "product_id", "item_id", "article_id"],
  pin_code_col: ["pin_code", "pincode", "pin", "zip", "postal_code"],
  units_sold_col: ["units_sold", "quantity", "qty", "units", "sales_qty", "volume"],
  unit_price_col: ["unit_price", "price", "price_per_unit", "mrp", "selling_price"],
};

const requiredFields: { key: keyof ColumnMapping; label: string; required: boolean }[] = [
  { key: "date_col", label: "Date", required: true },
  { key: "sku_id_col", label: "SKU ID", required: true },
  { key: "pin_code_col", label: "PIN Code", required: true },
  { key: "units_sold_col", label: "Units Sold", required: true },
  { key: "unit_price_col", label: "Unit Price", required: false },
];

export default function ColumnMappingPage() {
  const router = useRouter();
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});
  const [autoDetected, setAutoDetected] = useState<Set<string>>(new Set());
  const [isSynthetic, setIsSynthetic] = useState(false);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);

  const saveMappingMutation = useMutation({
    mutationFn: async ({ sessionId, mapping }: { sessionId: string; mapping: ColumnMapping }) => {
      const res = await fetch("/api/sales-history/map-columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, mapping }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data;
    },
  });

  useEffect(() => {
    const session = sessionStorage.getItem("upload_session");
    if (!session) {
      router.replace("/setup/sales-history");
      return;
    }

    const sessionData = JSON.parse(session);
    const columns = sessionData.detected_columns || [];
    setAvailableColumns(columns);
    setIsSynthetic(sessionData.is_synthetic || false);

    const detected = new Set<string>();
    const autoMapped: Partial<ColumnMapping> = {};

    for (const [field, keywords] of Object.entries(AUTO_DETECT_MAP)) {
      const match = columns.find((col: string) =>
        keywords.some((kw) => col.toLowerCase().includes(kw))
      );
      if (match) {
        autoMapped[field as keyof ColumnMapping] = match;
        detected.add(field);
      }
    }

    setMapping(autoMapped);
    setAutoDetected(detected);
  }, [router]);

  const canProceed = () => {
    return !!(mapping.date_col && mapping.sku_id_col && mapping.pin_code_col && mapping.units_sold_col);
  };

  const getSampleValue = (columnName: string | undefined) => {
    if (!columnName) return "—";
    const firstRow = previewRows[0] as Record<string, string>;
    return firstRow?.[columnName] || "—";
  };

  const handleProceed = async () => {
    const session = JSON.parse(sessionStorage.getItem("upload_session") || "{}");
    
    try {
      await saveMappingMutation.mutateAsync({
        sessionId: session.session_id,
        mapping: mapping as ColumnMapping,
      });

      session.column_mapping = mapping;
      sessionStorage.setItem("upload_session", JSON.stringify(session));
      router.push("/setup/sales-history/validate");
    } catch (error) {
      console.error("Failed to save mapping:", error);
    }
  };

  const handleSkipSynthetic = () => {
    router.push("/setup/sales-history/validate");
  };

  if (isSynthetic) {
    return (
      <div>
        <PageHeader
          title="Sales Data Ready"
          description="Synthetic data has been generated with pre-mapped columns"
        />
        <StepIndicator steps={STEPS} currentStep={2} />
        
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="rounded-full bg-purple-100 p-3">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Synthetic Data Generated</h2>
              <p className="text-sm text-muted-foreground">
                12 SKUs × 3 PINs × 180 days = 6,480 sales records
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 mb-6">
            <h3 className="font-medium mb-3">Column Mapping (Auto-detected)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-mono">date</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SKU ID</span>
                <span className="font-mono">sku_id</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PIN Code</span>
                <span className="font-mono">pin_code</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Units Sold</span>
                <span className="font-mono">units_sold</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit Price</span>
                <span className="font-mono">unit_price</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handleSkipSynthetic}>
              Continue to Inventory <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Column Mapping"
        description="Map your CSV columns to the required fields"
      />

      <StepIndicator steps={STEPS} currentStep={2} />

      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="px-6 py-3 text-sm font-medium text-slate-600">MicroPulse Field</th>
                <th className="px-6 py-3 text-sm font-medium text-slate-600">Required</th>
                <th className="px-6 py-3 text-sm font-medium text-slate-600">Your CSV Column</th>
                <th className="px-6 py-3 text-sm font-medium text-slate-600">Sample Value</th>
                <th className="px-6 py-3 text-sm font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {requiredFields.map((field) => {
                const isMapped = !!mapping[field.key];
                const isAutoDetected = autoDetected.has(field.key);

                return (
                  <tr key={field.key} className="border-b last:border-0">
                    <td className="px-6 py-4 font-medium">{field.label}</td>
                    <td className="px-6 py-4">
                      {field.required ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                          Required
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          Optional
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={mapping[field.key] || ""}
                        onChange={(e) =>
                          setMapping({ ...mapping, [field.key]: e.target.value || undefined })
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">— Select column —</option>
                        {availableColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                      {isAutoDetected && (
                        <p className="mt-1 text-xs text-purple-600">Auto-detected</p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                      {getSampleValue(mapping[field.key])}
                    </td>
                    <td className="px-6 py-4">
                      {isMapped ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <Check className="h-4 w-4" /> Mapped
                        </span>
                      ) : field.required ? (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <AlertCircle className="h-4 w-4" /> Required
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Skipped</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={handleProceed} disabled={!canProceed() || saveMappingMutation.isPending}>
          {saveMappingMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Validate Data <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
