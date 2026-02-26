"use client";

import { cn } from "@/lib/utils";
import { InventoryStatus } from "@/types";

interface StatusBadgeProps {
  status: "healthy" | "low" | "critical" | "active" | "inactive" | "no_history" | "ok" | "warn";
  className?: string;
}

const statusStyles = {
  healthy: "bg-green-100 text-green-700",
  low: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
  active: "bg-green-100 text-green-700",
  inactive: "bg-slate-100 text-slate-600",
  no_history: "bg-slate-100 text-slate-600",
  ok: "bg-green-100 text-green-700",
  warn: "bg-amber-100 text-amber-700",
};

const statusLabels = {
  healthy: "Healthy",
  low: "Low",
  critical: "Critical",
  active: "Active",
  inactive: "Inactive",
  no_history: "No History",
  ok: "Ready",
  warn: "Warning",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
