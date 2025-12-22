"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Loader2 } from "lucide-react";
import { updateSessionStatusAction } from "@/app/actions/admin-actions";

interface SessionStatusBadgeProps {
  sessionId: string;
  status: string;
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  open: { label: "Open", variant: "default" },
  closed: { label: "Closed", variant: "destructive" },
  completed: { label: "Completed", variant: "outline" },
};

export function SessionStatusBadge({
  sessionId,
  status,
}: SessionStatusBadgeProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const config = statusConfig[status] || statusConfig.draft;

  async function handleStatusChange(newStatus: string) {
    setLoading(true);

    const formData = new FormData();
    formData.set("sessionId", sessionId);
    formData.set("status", newStatus);

    await updateSessionStatusAction(formData);

    setLoading(false);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-1 focus:outline-none">
          <Badge variant={config.variant} className="cursor-pointer">
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                {config.label}
                <ChevronDown className="h-3 w-3 ml-1" />
              </>
            )}
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {Object.entries(statusConfig).map(([key, value]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => handleStatusChange(key)}
            disabled={key === status}
            className={key === status ? "bg-muted" : ""}
          >
            <Badge variant={value.variant} className="mr-2">
              {value.label}
            </Badge>
            {key === "draft" && "Not visible to parents"}
            {key === "open" && "Accepting registrations"}
            {key === "closed" && "No new registrations"}
            {key === "completed" && "Session finished"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
