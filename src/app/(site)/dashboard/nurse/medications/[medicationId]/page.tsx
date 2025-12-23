import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { medications } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Pill, User } from "lucide-react";
import { MedicationLogForm } from "@/components/nurse/medication-log-form";
import { Breadcrumb } from "@/components/dashboard/breadcrumb";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ medicationId: string }>;
}

export default async function NurseMedicationDetailPage({ params }: Props) {
  const { medicationId } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "nurse") {
    redirect("/dashboard");
  }

  const medication = await db.query.medications.findFirst({
    where: eq(medications.id, medicationId),
    with: {
      child: true,
      logs: {
        orderBy: (logs, { desc }) => [desc(logs.administeredAt)],
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

  if (!medication) {
    notFound();
  }

  const isActive = !medication.endDate || medication.endDate > new Date();

  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard/nurse" },
          { label: "Medications", href: "/dashboard/nurse/medications" },
          { label: medication.name },
        ]}
      />

      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{medication.name}</h1>
            <p className="text-muted-foreground">
              {medication.child.firstName} {medication.child.lastName}
            </p>
          </div>
          <Badge variant={isActive ? "default" : "outline"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded-xl bg-card shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Medication Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Dosage</p>
                <p className="font-medium">{medication.dosage}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Frequency</p>
                <p className="font-medium">{medication.frequency}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Start Date</p>
                <p className="font-medium">{formatDate(medication.startDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">End Date</p>
                <p className="font-medium">
                  {medication.endDate ? formatDate(medication.endDate) : "Ongoing"}
                </p>
              </div>
            </div>
            {medication.instructions && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Instructions</p>
                <p className="mt-1 text-sm">{medication.instructions}</p>
              </div>
            )}
          </div>

          <div className="border rounded-xl bg-card shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Administration History</h2>
            {medication.logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No administration logs yet.
              </p>
            ) : (
              <div className="space-y-3">
                {medication.logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border bg-muted/30 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{log.dosage}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.administeredAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Administered by {log.administrator?.name || "Unknown"}
                    </p>
                    {log.guardianNotified && (
                      <Badge variant="outline" className="mt-2">
                        Guardian Notified
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border rounded-xl bg-card shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Child Information
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">
                  {medication.child.firstName} {medication.child.lastName}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Date of Birth</p>
                <p className="font-medium">
                  {formatDate(medication.child.dateOfBirth)}
                </p>
              </div>
              {medication.child.allergies && medication.child.allergies.length > 0 && (
                <div>
                  <p className="text-muted-foreground">Allergies</p>
                  <p className="font-medium text-red-600">
                    {medication.child.allergies.join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>

          <MedicationLogForm
            medication={{
              id: medication.id,
              name: medication.name,
              dosage: medication.dosage,
              frequency: medication.frequency,
              instructions: medication.instructions,
              childId: medication.childId,
            }}
            child={{
              id: medication.child.id,
              firstName: medication.child.firstName,
              lastName: medication.child.lastName,
            }}
            recentLogs={medication.logs.slice(0, 3).map((log) => ({
              administeredAt: log.administeredAt,
              dosage: log.dosage,
              administrator: log.administrator
                ? { name: log.administrator.name ?? "Unknown" }
                : null,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
