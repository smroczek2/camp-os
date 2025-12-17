import { Suspense } from "react";
import {
  getDashboardStatsAction,
  getOrganizationsAction,
} from "@/app/actions/super-admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Super Admin Dashboard - Camp OS",
  description: "Camp OS administrative dashboard",
};

async function DashboardStats() {
  const stats = await getDashboardStatsAction();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Organizations
          </CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
          <p className="text-xs text-muted-foreground">
            {stats.activeOrganizations} active, {stats.trialOrganizations} trial
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">Across all organizations</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Signups</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.recentOnboardings}</div>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Suspended</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.suspendedOrganizations}
          </div>
          <p className="text-xs text-muted-foreground">Requiring attention</p>
        </CardContent>
      </Card>
    </div>
  );
}

async function RecentOrganizations() {
  const organizations = await getOrganizationsAction();
  const recent = organizations.slice(0, 5);

  const statusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "trial":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "suspended":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trial: "secondary",
      suspended: "destructive",
      inactive: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent Organizations</span>
          <Link
            href="/super-admin/organizations"
            className="text-sm font-normal text-purple-600 hover:underline"
          >
            View all
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No organizations yet
            </p>
          ) : (
            recent.map((org) => (
              <Link
                key={org.id}
                href={`/super-admin/organizations/${org.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {statusIcon(org.status)}
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {org.userCount} users • {org.contactEmail}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(org.status)}
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Link
            href="/super-admin/organizations"
            className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <Building2 className="h-4 w-4" />
            <span>View All Organizations</span>
          </Link>
          <Link
            href="/super-admin/users"
            className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <Users className="h-4 w-4" />
            <span>Manage Users</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of all Camp OS organizations and activity
        </p>
      </div>

      <Suspense fallback={<div>Loading stats...</div>}>
        <DashboardStats />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Suspense fallback={<div>Loading organizations...</div>}>
          <RecentOrganizations />
        </Suspense>
        <QuickActions />
      </div>
    </div>
  );
}
