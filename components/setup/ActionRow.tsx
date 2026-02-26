"use client";

import { cn } from "@/lib/utils";

interface ActionRowProps {
  children: React.ReactNode;
  className?: string;
}

export function ActionRow({ children, className }: ActionRowProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4 mb-4", className)}>
      {children}
    </div>
  );
}
