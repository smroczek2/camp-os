import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { incidents } from "@/lib/schema";
import { desc } from "drizzle-orm";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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

export default async function NurseIncidentsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "nurse") {
    redirect("/dashboard");
  }

  const allIncidents = await db.query.incidents.findMany({
    orderBy: [desc(incidents.occurredAt)],
    with: {
      child: true,
      reporter: true,
    },
  });

  const unresolvedCount = allIncidents.filter((i) => !i.resolution).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = allIncidents.filter(
    (i) => new Date(i.occurredAt) >= today
  ).length;

  const highSeverity = allIncidents.filter((i) => i.severity === "high").length;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard/nurse" },
          { label: "Incidents" },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Incident Reports</h1>
        <p className="text-muted-foreground">
          Review and resolve incidents across all sessions.
        </p>
      </div>

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
                href={`/dashboard/nurse/incidents/${incident.id}`}
                className="block"
              >
                <div className="p-6 border rounded-xl bg-card shadow-sm hover:shadow-md transition-all hover:border-primary/50">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-lg ${config.bgColor}`}
                    >
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>

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
                            Reported by {incident.reporter?.name || "Unknown"} •{" "}
                            {new Date(incident.occurredAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {incident.resolution ? (
                            <Badge className="bg-green-500">Resolved</Badge>
                          ) : (
                            <Badge variant="outline">Open</Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {incident.description}
                      </p>
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
