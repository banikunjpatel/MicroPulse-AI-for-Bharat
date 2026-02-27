"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/setup/PageHeader";
import { StepIndicator } from "@/components/setup/StepIndicator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, AlertCircle, Loader2, FileCheck, FileX } from "lucide-react";

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Map Columns" },
  { id: 3, label: "Validate" },
  { id: 4, label: "Confirm" },
];

interface ValidationError {
  row: number;
  column: string;
  value: string;
  issue: string;
}

export default function ValidatePage() {
  const router = useRouter();
  const [validationResult, setValidationResult] = useState<{
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    errors: ValidationError[];
    can_proceed: boolean;
  } | null>(null);

  const validateMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch("/api/sales-history/validate", {
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
    if (sessionData.is_synthetic) {
      setValidationResult({
        total_rows: 6480,
        valid_rows: 6480,
        invalid_rows: 0,
        errors: [],
        can_proceed: true,
      });
      return;
    }

    validateMutation.mutate(sessionData.session_id);
  }, [router]);

  useEffect(() => {
    if (validateMutation.isSuccess && validateMutation.data) {
      setValidationResult(validateMutation.data);
    }
  }, [validateMutation.isSuccess, validateMutation.data]);

  const handleProceed = () => {
    router.push("/setup/sales-history/confirm");
  };

  const isLoading = validateMutation.isPending;
  const hasErrors = validationResult && validationResult.invalid_rows > 0;
  const canProceed = validationResult?.can_proceed || false;

  return (
    <div>
      <PageHeader
        title="Validate Data"
        description="Review and validate your sales data before importing"
      />

      <StepIndicator steps={STEPS} currentStep={3} />

      {isLoading && (
        <div className="rounded-lg border bg-white p-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-600" />
          <p className="mt-4 text-muted-foreground">Validating your data...</p>
        </div>
      )}

      {!isLoading && validationResult && (
        <>
          <div className="rounded-lg border bg-white p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              {hasErrors ? (
                <div className="rounded-full bg-red-100 p-3">
                  <FileX className="h-6 w-6 text-red-600" />
                </div>
              ) : (
                <div className="rounded-full bg-green-100 p-3">
                  <FileCheck className="h-6 w-6 text-green-600" />
                </div>
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
                    {validationResult.errors.map((error, i) => (
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
                <p className="font-medium">
                  Too many invalid rows. Please fix your CSV and upload again.
                </p>
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
