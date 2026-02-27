"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/setup/PageHeader";
import { StepIndicator } from "@/components/setup/StepIndicator";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Sparkles, ArrowRight, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Map Columns" },
  { id: 3, label: "Validate" },
  { id: 4, label: "Confirm" },
];

export default function SalesHistoryUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done">("idle");

  const createSessionMutation = useMutation({
    mutationFn: async (filename: string) => {
      const res = await fetch("/api/sales-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          detected_columns: detectedColumns,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data;
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ sessionId, file }: { sessionId: string; file: File }) => {
      const formData = new FormData();
      formData.append("session_id", sessionId);
      formData.append("file", file);

      const res = await fetch("/api/sales-history/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data;
    },
  });

  const generateSyntheticMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/sales-history/generate-synthetic", {
        method: "POST",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data;
    },
  });

  const parseCSVPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.trim().split("\n");
      if (lines.length < 2) return;

      const headers = lines[0].split(",").map((h) => h.trim());
      setDetectedColumns(headers);

      const rows: Record<string, string>[] = [];
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || "";
        });
        rows.push(row);
      }
      setPreviewRows(rows);
    };
    reader.readAsText(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      setFile(droppedFile);
      parseCSVPreview(droppedFile);
      setUploadStatus("done");
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSVPreview(selectedFile);
      setUploadStatus("done");
    }
  };

  const handleProceed = async () => {
    if (!file) return;

    setUploadStatus("uploading");

    try {
      const sessionData = await createSessionMutation.mutateAsync(file.name);

      if (sessionData.is_s3) {
        sessionStorage.setItem(
          "upload_session",
          JSON.stringify({
            session_id: sessionData.session_id,
            detected_columns: detectedColumns,
            original_filename: file.name,
          })
        );
        router.push("/setup/sales-history/map-columns");
      } else {
        await uploadFileMutation.mutateAsync({ sessionId: sessionData.session_id, file });

        sessionStorage.setItem(
          "upload_session",
          JSON.stringify({
            session_id: sessionData.session_id,
            detected_columns: detectedColumns,
            original_filename: file.name,
          })
        );
        router.push("/setup/sales-history/map-columns");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadStatus("done");
    }
  };

  const handleGenerateSynthetic = async () => {
    try {
      const data = await generateSyntheticMutation.mutateAsync();
      
      sessionStorage.setItem(
        "upload_session",
        JSON.stringify({
          session_id: data.session_id,
          detected_columns: ["date", "sku_id", "pin_code", "units_sold", "unit_price"],
          original_filename: "synthetic_data.csv",
          is_synthetic: true,
        })
      );
      router.push("/setup/sales-history/map-columns");
    } catch (error) {
      console.error("Failed to generate synthetic data:", error);
    }
  };

  const handleDownloadTemplate = () => {
    const templateHeaders = "date,sku_id,pin_code,units_sold,unit_price";
    const sampleRows = [
      "2024-01-01,SKU-001,395011,142,18.00",
      "2024-01-01,SKU-002,395011,89,22.50",
      "2024-01-02,SKU-001,395011,156,18.00",
      "2024-01-02,SKU-002,395012,94,22.50",
    ];
    
    const csvContent = [templateHeaders, ...sampleRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sales_history_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isLoading = createSessionMutation.isPending || uploadFileMutation.isPending || generateSyntheticMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Sales History Upload"
        description="Upload historical sales data to train the forecasting model"
      />

      <StepIndicator steps={STEPS} currentStep={1} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Upload CSV File</h2>
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              isDragging
                ? "border-cyan-500 bg-cyan-50"
                : "border-slate-200 hover:border-cyan-400"
            )}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              id="sales-csv-upload"
            />
            <label htmlFor="sales-csv-upload" className="cursor-pointer">
              <Upload className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3 text-sm font-medium">
                Drag and drop your CSV file here
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                or click to browse
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Required columns: date, sku_id, pin_code, units_sold
              </p>
            </label>
          </div>

          {file && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-3">
              <FileText className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700">{file.name}</p>
                <p className="text-xs text-green-600">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Start</h2>
          
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4" onClick={handleDownloadTemplate}>
              <Download className="h-5 w-5 text-cyan-600" />
              <div className="text-left">
                <p className="font-medium">Download Template</p>
                <p className="text-xs text-muted-foreground">Get a sample CSV with the correct format</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 h-auto py-4" 
              onClick={handleGenerateSynthetic}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5 text-purple-600" />
              )}
              <div className="text-left">
                <p className="font-medium">Generate Synthetic Data (Demo)</p>
                <p className="text-xs text-muted-foreground">Create sample data with 180 days, 12 SKUs, 3 PINs</p>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {uploadStatus === "done" && previewRows.length > 0 && (
        <div className="mt-6 rounded-lg border bg-white overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold">Preview (First 5 rows)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  {detectedColumns.map((col) => (
                    <th key={col} className="px-4 py-2 text-left font-medium text-slate-600 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {detectedColumns.map((col) => (
                      <td key={col} className="px-4 py-2 whitespace-nowrap">
                        {row[col] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button 
          onClick={handleProceed}
          disabled={uploadStatus !== "done" || isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              Next: Map Columns <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
