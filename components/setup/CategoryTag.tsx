"use client";

import { cn } from "@/lib/utils";
import { SKUCategory } from "@/types";

interface CategoryTagProps {
  category: SKUCategory;
  className?: string;
}

const categoryStyles: Record<SKUCategory, string> = {
  beverages: "bg-blue-100 text-blue-700",
  snacks: "bg-orange-100 text-orange-700",
  dairy: "bg-purple-100 text-purple-700",
  personal_care: "bg-pink-100 text-pink-700",
  household: "bg-slate-100 text-slate-700",
  other: "bg-gray-100 text-gray-700",
};

const categoryLabels: Record<SKUCategory, string> = {
  beverages: "Beverages",
  snacks: "Snacks",
  dairy: "Dairy",
  personal_care: "Personal Care",
  household: "Household",
  other: "Other",
};

export function CategoryTag({ category, className }: CategoryTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        categoryStyles[category],
        className
      )}
    >
      {categoryLabels[category]}
    </span>
  );
}
