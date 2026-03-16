"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function formatLabel(segment: string): string {
  const labels: Record<string, string> = {
    dashboard: "Dashboard",
    forecasts: "Forecasts",
    setup: "Data Setup",
    skus: "SKU Catalog",
    inventory: "Inventory",
    "sales-history": "Sales History",
    "pin-codes": "PIN Codes",
    "sales": "Sales",
    chat: "AI Chat",
  };
  return labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

export function Breadcrumbs() {
  const pathname = usePathname();
  
  const segments = pathname.split("/").filter(Boolean);
  
  if (segments.length <= 1) return null;
  
  const items: BreadcrumbItem[] = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    
    return {
      label: formatLabel(segment),
      href: isLast ? undefined : href,
    };
  });

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span>Home</span>
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
