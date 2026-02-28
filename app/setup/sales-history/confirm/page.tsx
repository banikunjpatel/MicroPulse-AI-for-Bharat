/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/setup/PageHeader";
import { StepIndicator } from "@/components/setup/StepIndicator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Loader2, FileCheck, Package, MapPin, AlertCircle } from "lucide-react";

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Map Columns" },
  { id: 3, label: "Validate" },
  { id: 4, label: "Confirm" },
];

interface ImportResult {
  session_id: string;
  imported_count: number;
  skipped_count: number;
  pins_auto_created: number;
  reasons: {
    missing_skus: number;
    missing_pins: number;
    invalid_data: number;
  };
  missing_skus_list: string[];
  missing_pins_list: string[];
  message: string;
}

function getInitialSession() {
  if (typeof window === "undefined") return null;
  const session = sessionStorage.getItem("upload_session");
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

export default function ConfirmPage() {
  const router = useRouter();
  const [sessionData, setSessionData] = useState<{
    is_synthetic: boolean;
    original_filename: string;
    session_id: string;
  } | null>(null);

  useEffect(() => {
    const data = getInitialSession();
    if (!data) {
      router.replace("/setup/sales-history");
      return;
    }
    setSessionData(data);
  }, [router]);

  const { data: sessionDetails, isLoading: isLoadingSession } = useQuery({
    queryKey: ["session", sessionData?.session_id],
    queryFn: async () => {
      if (!sessionData || sessionData.is_synthetic) return null;
      const res = await fetch(`/api/sales-history/${sessionData.session_id}`);
      const json = await res.json();
      return json.success ? json.data : null;
    },
    enabled: !!sessionData && !sessionData.is_synthetic,
  });

  const importMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch("/api/sales-history/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data as ImportResult;
    },
  });

  useEffect(() => {
    if (sessionData?.is_synthetic && !importMutation.isPending && !importMutation.isSuccess) {
      importMutation.mutate(sessionData.session_id);
    }
  }, [sessionData, importMutation.isPending, importMutation.isSuccess]);

  const summary = useMemo(() => {
    if (!sessionData) return null;
    return {
      filename: sessionData.original_filename,
      total_rows: sessionData.is_synthetic ? 6480 : (sessionDetails?.row_count || 0),
      session_id: sessionData.session_id,
      date_range: sessionDetails?.date_range,
    };
  }, [sessionData, sessionDetails]);

  const isSynthetic = sessionData?.is_synthetic ?? false;
  const isLoading = !sessionData || isLoadingSession || importMutation.isPending;
  const isSuccess = importMutation.isSuccess;
  const importResult = importMutation.data;

  const handleImport = () => {
    if (sessionData) {
      importMutation.mutate(sessionData.session_id);
    }
  };

  const handleComplete = () => {
    sessionStorage.removeItem("upload_session");
    router.push("/setup/sales-history");
  };

  if (!sessionData) {
    return (
      <div>
        <PageHeader title="Loading..." description="Please wait" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Confirm Import"
        description="Review and confirm the import of your sales data"
      />

      <StepIndicator steps={STEPS} currentStep={4} />

      {!isSynthetic && summary && (
        <div className="rounded-lg border bg-white p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Import Summary</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FileCheck className="h-5 w-5 text-cyan-600" />
              <div>
                <p className="text-sm text-muted-foreground">File</p>
                <p className="font-medium">{summary.filename}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-cyan-600" />
              <div>
                <p className="text-sm text-muted-foreground">Date Range</p>
                {summary.date_range ? (
                  <p className="font-medium">
                    {summary.date_range.min_date} to {summary.date_range.max_date}
                  </p>
                ) : (
                  <p className="font-medium">To be determined after import</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-cyan-600" />
              <div>
                <p className="text-sm text-muted-foreground">SKUs</p>
                <p className="font-medium">
                  {summary.date_range ? `${summary.date_range.unique_skus} SKUs` : "All registered SKUs"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-cyan-600" />
              <div>
                <p className="text-sm text-muted-foreground">PIN Codes</p>
                <p className="font-medium">
                  {summary.date_range ? `${summary.date_range.unique_pins} PIN codes` : "All active PIN codes"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="rounded-lg border bg-white p-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-600" />
          <p className="mt-4 text-muted-foreground">Importing your sales data...</p>
          <p className="text-sm text-muted-foreground">This may take a moment</p>
        </div>
      )}

      {isSuccess && importResult && (
        <div className="rounded-lg border bg-white p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="rounded-full bg-green-100 p-3">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Import Complete!</h2>
              <p className="text-sm text-muted-foreground">{importResult.message}</p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Imported</p>
                <p className="text-xl font-semibold text-green-600">{importResult.imported_count.toLocaleString()}</p>
              </div>
              {importResult.skipped_count > 0 && (
                <div>
                  <p className="text-muted-foreground">Skipped</p>
                  <p className="text-xl font-semibold text-amber-600">{importResult.skipped_count.toLocaleString()}</p>
                </div>
              )}
              {importResult.pins_auto_created > 0 && (
                <div>
                  <p className="text-muted-foreground">PINs Created</p>
                  <p className="text-xl font-semibold text-cyan-600">{importResult.pins_auto_created}</p>
                </div>
              )}
              {importResult.missing_skus_list.length > 0 && (
                <div>
                  <p className="text-muted-foreground">Missing SKUs</p>
                  <p className="text-xl font-semibold text-red-600">{importResult.missing_skus_list.length}</p>
                </div>
              )}
            </div>
          </div>

          {importResult.reasons && (
            <div className="space-y-2 text-sm">
              {importResult.reasons.missing_skus > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{importResult.reasons.missing_skus} rows skipped due to missing SKUs</span>
                </div>
              )}
              {importResult.reasons.missing_pins > 0 && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{importResult.reasons.missing_pins} rows skipped due to missing PINs</span>
                </div>
              )}
              {importResult.reasons.invalid_data > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{importResult.reasons.invalid_data} rows skipped due to invalid data</span>
                </div>
              )}
            </div>
          )}

          {importResult.missing_skus_list.length > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm font-medium text-red-700 mb-2">Missing SKUs (not imported):</p>
              <div className="flex flex-wrap gap-2">
                {importResult.missing_skus_list.slice(0, 10).map((sku) => (
                  <span key={sku} className="px-2 py-1 bg-white border border-red-200 rounded text-xs font-mono text-red-600">
                    {sku}
                  </span>
                ))}
                {importResult.missing_skus_list.length > 10 && (
                  <span className="px-2 py-1 text-xs text-red-600">
                    +{importResult.missing_skus_list.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()} disabled={isLoading}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        {!isSynthetic && !isSuccess && (
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                Import Sales Data <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}

        {isSuccess && (
          <Button onClick={handleComplete}>
            View Sales History <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
