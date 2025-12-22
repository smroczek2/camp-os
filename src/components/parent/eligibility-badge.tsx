"use client";

import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EligibilityBadgeProps {
  eligible: boolean;
  reason?: string;
  className?: string;
}

export function EligibilityBadge({ eligible, reason, className }: EligibilityBadgeProps) {
  if (eligible) {
    return (
      <div className={cn("flex items-center gap-1.5 text-sm text-green-600", className)}>
        <CheckCircle className="h-4 w-4" />
        <span>Eligible</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5 text-sm text-red-600", className)}>
      <XCircle className="h-4 w-4" />
      <span>{reason || "Not eligible"}</span>
    </div>
  );
}
