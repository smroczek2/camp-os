import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStatProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconColor?: string;
  iconBgColor?: string;
}

export function DashboardStat({
  icon: Icon,
  value,
  label,
  trend,
  iconColor = "text-blue-600",
  iconBgColor = "bg-blue-500/10",
}: DashboardStatProps) {
  return (
    <div className="p-6 border rounded-xl bg-card shadow-sm">
      <div className="flex items-center gap-4">
        <div className={cn("flex items-center justify-center w-12 h-12 rounded-lg", iconBgColor)}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {trend && (
            <p
              className={cn(
                "text-xs mt-1",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.value}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
