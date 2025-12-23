import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusType =
  | "confirmed"
  | "pending"
  | "completed"
  | "canceled"
  | "refunded"
  | "waiting"
  | "offered"
  | "expired"
  | "open"
  | "draft"
  | "closed";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  {
    icon: typeof CheckCircle2;
    label: string;
    className: string;
  }
> = {
  confirmed: {
    icon: CheckCircle2,
    label: "Confirmed",
    className: "bg-green-500",
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    className: "bg-green-500",
  },
  pending: {
    icon: AlertCircle,
    label: "Pending",
    className: "text-orange-600",
  },
  waiting: {
    icon: Clock,
    label: "Waiting",
    className: "text-blue-600",
  },
  offered: {
    icon: CheckCircle2,
    label: "Offered",
    className: "bg-green-500",
  },
  canceled: {
    icon: XCircle,
    label: "Canceled",
    className: "text-muted-foreground",
  },
  refunded: {
    icon: XCircle,
    label: "Refunded",
    className: "text-muted-foreground",
  },
  expired: {
    icon: XCircle,
    label: "Expired",
    className: "text-red-600",
  },
  open: {
    icon: CheckCircle2,
    label: "Open",
    className: "bg-green-500",
  },
  draft: {
    icon: Clock,
    label: "Draft",
    className: "text-muted-foreground",
  },
  closed: {
    icon: XCircle,
    label: "Closed",
    className: "text-muted-foreground",
  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  return (
    <Badge
      variant={
        status === "confirmed" ||
        status === "completed" ||
        status === "offered" ||
        status === "open"
          ? "default"
          : "outline"
      }
      className={cn(config.className, className)}
    >
      <Icon className="h-3 w-3 mr-1" />
      {displayLabel}
    </Badge>
  );
}
