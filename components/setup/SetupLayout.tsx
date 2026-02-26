"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SIDEBAR_ITEMS = [
  {
    section: "Data Setup",
    items: [
      { label: "SKU Catalog", href: "/setup/skus" },
      { label: "Inventory", href: "/setup/inventory" },
      { label: "Sales History", href: "/setup/sales-history" },
      { label: "Stores / PIN Codes", href: "/setup/pin-codes" },
    ],
  },
];

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-cyan-500 to-blue-600" />
            <span className="text-lg">MicroPulse</span>
          </Link>
          <nav className="ml-8 flex items-center gap-6">
            <Link
              href="/dashboard"
              className={cn(
                "text-sm font-medium transition-colors hover:text-cyan-600",
                !pathname.startsWith("/setup") && "text-muted-foreground"
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/setup/skus"
              className={cn(
                "text-sm font-medium transition-colors hover:text-cyan-600",
                pathname.startsWith("/setup") && "text-cyan-600"
              )}
            >
              Data Setup
            </Link>
            <Link
              href="/forecasts"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-cyan-600"
            >
              Forecasts
            </Link>
            <Link
              href="/chat"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-cyan-600"
            >
              AI Chat
            </Link>
          </nav>
        </div>
      </header>
      <div className="container mx-auto flex">
        <aside className="hidden w-64 flex-col border-r bg-white py-6 md:flex min-h-[calc(100vh-3.5rem)]">
          {SIDEBAR_ITEMS.map((section) => (
            <div key={section.section} className="px-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.section}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-cyan-50 text-cyan-700"
                        : "text-muted-foreground hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </aside>
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
