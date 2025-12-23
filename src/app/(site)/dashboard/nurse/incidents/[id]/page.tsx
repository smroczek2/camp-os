import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { incidents } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
  User,
  FileText,
} from "lucide-react";
import { ResolveIncidentForm } from "@/components/admin/resolve-incident-form";
import { Breadcrumb } from "@/components/dashboard/breadcrumb";

export const dynamic = "force-dynamic";

const severityConfig: Record<
  string,
  { icon: typeof AlertTriangle; color: string; bgColor: string; label: string }
> = {
  high: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-500/10",
    label: "High Severity",
  },
  medium: {
    icon: AlertCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
    label: "Medium Severity",
  },
  low: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    label: "Low Severity",
  },
};

const typeLabels: Record<string, string> = {
  injury: "Injury",
  illness: "Illness",
  behavior: "Behavior",
  other: "Other",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NurseIncidentDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "nurse") {
    redirect("/dashboard");
  }

  const incident = await db.query.incidents.findFirst({
    where: eq(incidents.id, id),
    with: {
      child: {
        with: {
          medications: true,
        },
      },
      reporter: true,
    },
  });

  if (!incident) {
    notFound();
  }

  const config = severityConfig[incident.severity] || severityConfig.low;
  const Icon = config.icon;

  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard/nurse" },
          { label: "Incidents", href: "/dashboard/nurse/incidents" },
          { label: "Incident" },
        ]}
      />

      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`flex items-center justify-center w-14 h-14 rounded-xl ${config.bgColor}`}
            >
              <Icon className={`h-7 w-7 ${config.color}`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Incident Report</h1>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    incident.severity === "high"
                      ? "destructive"
                      : incident.severity === "medium"
                        ? "default"
                        : "secondary"
                  }
                >
                  {config.label}
                </Badge>
                <Badge variant="outline">
                  {typeLabels[incident.type] || incident.type}
                </Badge>
                {incident.resolution ? (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Resolved
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    Open
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded-xl bg-card shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Incident Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="mt-1 text-base whitespace-pre-wrap">
                  {incident.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Occurred At
                  </label>
                  <p className="mt-1">
                    {new Date(incident.occurredAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Reported At
                  </label>
                  <p className="mt-1">
                    {new Date(incident.createdAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-xl bg-card shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Resolution
            </h2>

            {incident.resolution ? (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 whitespace-pre-wrap">
                  {incident.resolution}
                </p>
              </div>
            ) : (
              <ResolveIncidentForm incidentId={incident.id} />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border rounded-xl bg-card shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Child Information
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Name
                </label>
                <p className="mt-1 font-medium">
                  {incident.child.firstName} {incident.child.lastName}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Date of Birth
                </label>
                <p className="mt-1">
                  {new Date(incident.child.dateOfBirth).toLocaleDateString()}
                </p>
              </div>

              {incident.child.allergies && incident.child.allergies.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Allergies
                  </label>
                  <p className="mt-1 text-red-600">
                    {incident.child.allergies.join(", ")}
                  </p>
                </div>
              )}

              {incident.child.medicalNotes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Medical Notes
                  </label>
                  <p className="mt-1 text-sm">{incident.child.medicalNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
