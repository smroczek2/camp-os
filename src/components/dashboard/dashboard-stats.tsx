import { DashboardStat } from "@/components/ui/dashboard-stat";
import { Users, Calendar, AlertCircle, FileText } from "lucide-react";

interface DashboardStatsProps {
  childrenCount: number;
  activeRegistrationsCount: number;
  pendingPaymentsCount: number;
  waitlistCount: number;
}

export function DashboardStats({
  childrenCount,
  activeRegistrationsCount,
  pendingPaymentsCount,
  waitlistCount,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <DashboardStat
        icon={Users}
        value={childrenCount}
        label={childrenCount === 1 ? "Child" : "Children"}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-500/10"
      />
      <DashboardStat
        icon={Calendar}
        value={activeRegistrationsCount}
        label="Active Registrations"
        iconColor="text-green-600"
        iconBgColor="bg-green-500/10"
      />
      <DashboardStat
        icon={AlertCircle}
        value={pendingPaymentsCount}
        label="Pending Payments"
        iconColor="text-orange-600"
        iconBgColor="bg-orange-500/10"
      />
      <DashboardStat
        icon={FileText}
        value={waitlistCount}
        label="On Waitlist"
        iconColor="text-purple-600"
        iconBgColor="bg-purple-500/10"
      />
    </div>
  );
}
