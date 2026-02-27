"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/setup/PageHeader";
import { StepIndicator } from "@/components/setup/StepIndicator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Loader2, FileCheck, Calendar, Package, MapPin } from "lucide-react";

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Map Columns" },
  { id: 3, label: "Validate" },
  { id: 4, label: "Confirm" },
];

export default function ConfirmPage() {
  const router = useRouter();
  const [isSynthetic, setIsSynthetic] = useState(false);
  const [summary, setSummary] = useState<{
    filename: string;
    total_rows: number;
    session_id: string;
  } | null>(null);

  const importMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch("/api/sales-history/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
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
    setIsSynthetic(sessionData.is_synthetic || false);
    setSummary({
      filename: sessionData.original_filename,
      total_rows: sessionData.is_synthetic ? 6480 : 0,
      session_id: sessionData.session_id,
    });

    if (sessionData.is_synthetic) {
      importMutation.mutate(sessionData.session_id);
    }
  }, [router]);

  const handleImport = () => {
    const session = sessionStorage.getItem("upload_session");
    if (!session) return;

    const sessionData = JSON.parse(session);
    importMutation.mutate(sessionData.session_id);
  };

  const handleComplete = () => {
    sessionStorage.removeItem("upload_session");
    router.push("/setup/inventory");
  };

  const isLoading = importMutation.isPending;
  const isSuccess = importMutation.isSuccess;
  const importResult = importMutation.data;

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
              <Calendar className="h-5 w-5 text-cyan-600" />
              <div>
                <p className="text-sm text-muted-foreground">Date Range</p>
                <p className="font-medium">180 days (simulated)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-cyan-600" />
              <div>
                <p className="text-sm text-muted-foreground">SKUs</p>
                <p className="font-medium">All registered SKUs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-cyan-600" />
              <div>
                <p className="text-sm text-muted-foreground">PIN Codes</p>
                <p className="font-medium">All active PIN codes</p>
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
              <h2 className="text-lg font-semibold">Import Successful!</h2>
              <p className="text-sm text-muted-foreground">
                {importResult.imported_count.toLocaleString()} sales records imported
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Imported</p>
                <p className="font-semibold text-green-600">{importResult.imported_count.toLocaleString()}</p>
              </div>
              {importResult.skipped_count > 0 && (
                <div>
                  <p className="text-muted-foreground">Skipped</p>
                  <p className="font-semibold text-amber-600">{importResult.skipped_count.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
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
            Continue to Inventory <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
