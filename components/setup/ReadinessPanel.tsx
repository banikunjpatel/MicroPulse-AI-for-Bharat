"use client";

import { ReadinessCheck } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadinessPanelProps {
  readiness: ReadinessCheck;
}

export function ReadinessPanel({ readiness }: ReadinessPanelProps) {
  const checks = [
    {
      key: "skus",
      label: "SKU Catalog",
      status: readiness.skus.ok,
      readyLabel: `${readiness.skus.count} SKUs`,
      notReadyLabel: "No SKUs added",
      actionHref: "/setup/skus",
    },
    {
      key: "sales_history",
      label: "Sales History",
      status: readiness.sales_history.ok,
      readyLabel: `${readiness.sales_history.days_of_data} days`,
      notReadyLabel: `Only ${readiness.sales_history.days_of_data} days (need 30+)`,
      actionHref: "/setup/sales-history",
    },
    {
      key: "inventory",
      label: "Current Inventory",
      status: readiness.inventory.ok,
      readyLabel: "All inventory set",
      notReadyLabel: `${readiness.inventory.missing_count} SKUs missing data`,
      actionHref: "/setup/inventory",
    },
    {
      key: "pin_codes",
      label: "PIN Codes",
      status: readiness.pin_codes.ok,
      readyLabel: `${readiness.pin_codes.count} zones`,
      notReadyLabel: "No PIN codes added",
      actionHref: "/setup/pin-codes",
    },
  ];

  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="text-lg font-semibold mb-4">Data Readiness Check</h2>
      <div className="space-y-3">
        {checks.map((check) => (
          <div
            key={check.key}
            className={cn(
              "flex items-center justify-between rounded-lg border p-3",
              check.status ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
            )}
          >
            <div className="flex items-center gap-3">
              {check.status ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              )}
              <div>
                <p className="font-medium">{check.label}</p>
                <p className={cn("text-sm", check.status ? "text-green-600" : "text-amber-600")}>
                  {check.status ? check.readyLabel : check.notReadyLabel}
                </p>
              </div>
            </div>
            {!check.status && (
              <Button asChild variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                <Link href={check.actionHref}>
                  Fill Now <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
