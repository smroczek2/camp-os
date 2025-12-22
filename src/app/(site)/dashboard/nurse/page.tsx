import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { medications } from "@/lib/schema";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Pill, Activity, Users, Clock } from "lucide-react";
import { MedicationLogForm } from "@/components/nurse/medication-log-form";
import { and, lte, or, isNull, gte, desc } from "drizzle-orm";

export default async function NurseDashboard() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Get all children with medical information
  const allChildren = await db.query.children.findMany({
    with: {
      medications: true,
      registrations: {
        with: {
          session: true,
        },
      },
    },
  });

  // Get medications due today (active medications)
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));

  const medicationsDueToday = await db.query.medications.findMany({
    where: and(
      lte(medications.startDate, todayEnd),
      or(isNull(medications.endDate), gte(medications.endDate, todayStart))
    ),
    with: {
      child: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      logs: {
        where: and(
          gte(medications.createdAt, todayStart),
          lte(medications.createdAt, todayEnd)
        ),
        orderBy: desc(medications.createdAt),
        limit: 5,
        with: {
          administrator: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  // Get recent medication logs
  const recentLogs = await db.query.medicationLogs.findMany({
    orderBy: (logs, { desc }) => [desc(logs.administeredAt)],
    limit: 10,
    with: {
      child: true,
      medication: true,
      administrator: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Get recent incidents
  const recentIncidents = await db.query.incidents.findMany({
    orderBy: (incidents, { desc }) => [desc(incidents.createdAt)],
    limit: 10,
    with: {
      child: true,
      reporter: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Calculate stats
  const childrenWithAllergies = allChildren.filter(
    (child) => child.allergies && child.allergies.length > 0
  );
  const activeMedications = allChildren.reduce(
    (sum, child) =>
      sum +
      child.medications.filter(
        (med) => !med.endDate || new Date(med.endDate) > new Date()
      ).length,
    0
  );
  const unresolvedIncidents = recentIncidents.filter(
    (incident) => !incident.resolution
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Nurse Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Welcome, {session.user.name}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-500/10">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{childrenWithAllergies.length}</p>
              <p className="text-sm text-muted-foreground">
                Children with Allergies
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
              <Pill className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeMedications}</p>
              <p className="text-sm text-muted-foreground">
                Active Medications
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-500/10">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unresolvedIncidents.length}</p>
              <p className="text-sm text-muted-foreground">
                Unresolved Incidents
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allChildren.length}</p>
              <p className="text-sm text-muted-foreground">Total Children</p>
            </div>
          </div>
        </div>
      </div>

      {/* Medications Due Today */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Clock className="h-6 w-6 text-blue-600" />
          Medications Due Today
        </h2>
        {medicationsDueToday.length === 0 ? (
          <div className="text-center p-12 border rounded-xl bg-muted/30">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No medications scheduled for today
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {medicationsDueToday.map((med) => {
              const todayLogs = med.logs.filter((log) => {
                const logDate = new Date(log.administeredAt);
                return (
                  logDate >= todayStart && logDate <= todayEnd
                );
              });
              const isAdministeredToday = todayLogs.length > 0;

              return (
                <div
                  key={med.id}
                  className={`p-4 border rounded-xl ${
                    isAdministeredToday
                      ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                      : "bg-card shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-semibold">
                        {med.child.firstName} {med.child.lastName}
                      </p>
                      <p className="text-lg font-medium text-blue-600 mt-1">
                        {med.name}
                      </p>
                    </div>
                    {isAdministeredToday && (
                      <Badge variant="outline" className="bg-green-100 dark:bg-green-900">
                        Given Today
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 mb-3">
                    <p className="text-sm text-muted-foreground">
                      <strong>Dosage:</strong> {med.dosage}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Frequency:</strong> {med.frequency}
                    </p>
                    {med.instructions && (
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                        {med.instructions}
                      </p>
                    )}
                  </div>
                  <MedicationLogForm
                    medication={{
                      id: med.id,
                      name: med.name,
                      dosage: med.dosage,
                      frequency: med.frequency,
                      instructions: med.instructions,
                      childId: med.childId,
                    }}
                    child={{
                      id: med.child.id,
                      firstName: med.child.firstName,
                      lastName: med.child.lastName,
                    }}
                    recentLogs={med.logs.map((log) => ({
                      administeredAt: log.administeredAt,
                      dosage: log.dosage,
                      administrator: log.administrator,
                    }))}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Medical Alerts */}
      {childrenWithAllergies.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-600" />
            Medical Alerts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {childrenWithAllergies.map((child) => (
              <div
                key={child.id}
                className="p-4 border-2 border-red-200 rounded-xl bg-red-50/50 dark:bg-red-950/20 dark:border-red-900"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold">
                    {child.firstName} {child.lastName}
                  </p>
                  <Badge variant="destructive">Allergies</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    Allergies:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {child.allergies?.map((allergy, idx) => (
                      <li key={idx}>{allergy}</li>
                    ))}
                  </ul>
                  {child.medicalNotes && (
                    <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-900">
                      <p className="text-xs text-muted-foreground">
                        <strong>Notes:</strong> {child.medicalNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Medication Logs */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Pill className="h-6 w-6 text-blue-600" />
          Recent Medication Administration
        </h2>
        {recentLogs.length === 0 ? (
          <div className="text-center p-12 border rounded-xl bg-muted/30">
            <Pill className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No medication logs yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold">
                        {log.child.firstName} {log.child.lastName}
                      </p>
                      <Badge variant="outline">{log.medication.name}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Dosage: {log.dosage}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Administered by {log.administrator?.name || "Unknown"}{" "}
                      on{" "}
                      {new Date(log.administeredAt).toLocaleString()}
                    </p>
                    {log.guardianNotified && (
                      <Badge variant="outline" className="mt-2">
                        Guardian Notified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Incidents */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Activity className="h-6 w-6 text-orange-600" />
          Recent Incidents
        </h2>
        {recentIncidents.length === 0 ? (
          <div className="text-center p-12 border rounded-xl bg-muted/30">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No incidents reported</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentIncidents.map((incident) => (
              <div
                key={incident.id}
                className="p-4 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold">
                        {incident.child.firstName} {incident.child.lastName}
                      </p>
                      <Badge
                        variant={
                          incident.severity === "high"
                            ? "destructive"
                            : incident.severity === "medium"
                            ? "default"
                            : "outline"
                        }
                      >
                        {incident.severity}
                      </Badge>
                      {incident.resolution && (
                        <Badge variant="outline">Resolved</Badge>
                      )}
                      {!incident.resolution && (
                        <Badge variant="default">Open</Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium mb-1">{incident.type}</p>
                    {incident.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {incident.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Reported by {incident.reporter?.name || "Unknown"}{" "}
                      on {new Date(incident.createdAt).toLocaleString()}
                    </p>
                    {incident.resolution && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          <strong>Resolution:</strong> {incident.resolution}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
