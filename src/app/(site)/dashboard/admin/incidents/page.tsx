import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { incidents } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Breadcrumb } from "@/components/dashboard/breadcrumb";

export const dynamic = "force-dynamic";

const severityConfig: Record<
  string,
  { icon: typeof AlertTriangle; color: string; bgColor: string }
> = {
  high: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-500/10",
  },
  medium: {
    icon: AlertCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
  },
  low: { icon: Info, color: "text-blue-600", bgColor: "bg-blue-500/10" },
};

const typeLabels: Record<string, string> = {
  injury: "Injury",
  illness: "Illness",
  behavior: "Behavior",
  other: "Other",
};

export default async function IncidentsFeedPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // Get all incidents
  const allIncidents = await db.query.incidents.findMany({
    orderBy: [desc(incidents.occurredAt)],
    with: {
      child: true,
      reporter: true,
    },
  });

  // Count unresolved
  const unresolvedCount = allIncidents.filter((i) => !i.resolution).length;

  // Count today's incidents
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = allIncidents.filter(
    (i) => new Date(i.occurredAt) >= today
  ).length;

  // Group by severity for stats
  const highSeverity = allIncidents.filter((i) => i.severity === "high").length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard/admin" },
          { label: "Incident Reports" },
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Incident Reports</h1>
            <p className="text-muted-foreground text-lg">
              Track and manage incident reports across all sessions
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-500/10">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-3xl font-bold">{unresolvedCount}</p>
              <p className="text-sm text-muted-foreground">Unresolved</p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
              <AlertCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold">{todayCount}</p>
              <p className="text-sm text-muted-foreground">Today</p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-3xl font-bold">{highSeverity}</p>
              <p className="text-sm text-muted-foreground">High Severity</p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold">
                {allIncidents.length - unresolvedCount}
              </p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Incidents List */}
      {allIncidents.length === 0 ? (
        <div className="text-center p-16 border rounded-xl bg-muted/30">
          <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
          <h3 className="text-xl font-semibold mb-2">No incidents reported</h3>
          <p className="text-muted-foreground">
            All clear! No incidents have been reported yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {allIncidents.map((incident) => {
            const config = severityConfig[incident.severity] || severityConfig.low;
            const Icon = config.icon;

            return (
              <Link
                key={incident.id}
                href={`/dashboard/admin/incidents/${incident.id}`}
                className="block"
              >
                <div className="p-6 border rounded-xl bg-card shadow-sm hover:shadow-md transition-all hover:border-primary/50">
                  <div className="flex items-start gap-4">
                    {/* Severity Icon */}
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-lg ${config.bgColor}`}
                    >
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">
                              {incident.child.firstName} {incident.child.lastName}
                            </span>
                            <Badge
                              variant={
                                incident.severity === "high"
                                  ? "destructive"
                                  : incident.severity === "medium"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {incident.severity}
                            </Badge>
                            <Badge variant="outline">
                              {typeLabels[incident.type] || incident.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Reported by {incident.reporter?.name || "Unknown"} on{" "}
                            {new Date(incident.occurredAt).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>

                        {/* Resolution Status */}
                        {incident.resolution ? (
                          <Badge className="bg-green-500 shrink-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="shrink-0">
                            <Clock className="h-3 w-3 mr-1" />
                            Open
                          </Badge>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm line-clamp-2">{incident.description}</p>

                      {/* Resolution Preview */}
                      {incident.resolution && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-green-800">
                            <strong>Resolution:</strong> {incident.resolution}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
